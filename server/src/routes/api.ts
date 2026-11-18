import { Router } from "express";
import { getDb } from "../data/db";

export const apiRouter = Router();

/** GET /api/products?category=&keyword=&minPrice=&maxPrice=&sort= */
apiRouter.get("/products", (req, res) => {
  const { category, keyword, minPrice, maxPrice, sort } = req.query as Record<string, string | undefined>;
  const db = getDb();
  let list = db.products;
  if (category) list = list.filter((p) => p.category === category);
  if (keyword) {
    const kw = keyword.toLowerCase();
    list = list.filter((p) => [p.name, p.brand, p.description, ...p.tags].join(" ").toLowerCase().includes(kw));
  }
  if (minPrice) list = list.filter((p) => p.price >= Number(minPrice));
  if (maxPrice) list = list.filter((p) => p.price <= Number(maxPrice));
  list = [...list].sort((a, b) =>
    sort === "price_asc" ? a.price - b.price : sort === "price_desc" ? b.price - a.price : b.rating - a.rating
  );
  res.json({ total: list.length, products: list });
});

/** GET /api/products/:id */
apiRouter.get("/products/:id", (req, res) => {
  const product = getDb().products.find((p) => p.id === req.params.id);
  if (!product) {
    res.status(404).json({ error: `商品 ${req.params.id} 不存在` });
    return;
  }
  res.json(product);
});

/** GET /api/orders?userId= */
apiRouter.get("/orders", (req, res) => {
  const { userId } = req.query as Record<string, string | undefined>;
  const db = getDb();
  const orders = db.orders
    .filter((o) => !userId || o.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ total: orders.length, orders });
});

/** GET /api/users */
apiRouter.get("/users", (_req, res) => {
  res.json({ users: getDb().users });
});
