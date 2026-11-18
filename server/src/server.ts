import cors from "cors";
import express from "express";
import { loadDb } from "./data/db";
import { apiRouter } from "./routes/api";
import { chatRouter } from "./routes/chat";

const PORT = Number(process.env.PORT ?? 3002);

// 首次启动：种子数据落盘到 server/data/db.json
const db = loadDb();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "cartpilot-server", products: db.products.length, orders: db.orders.length });
});
app.use("/api", apiRouter);
app.use("/api", chatRouter);

app.listen(PORT, () => {
  console.log(`[CartPilot] server listening on http://localhost:${PORT}`);
});
