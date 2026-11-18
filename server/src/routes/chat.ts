import { Router } from "express";
import { RuleBasedEngine } from "../agent/engine";
import { OpenAIEngine } from "../agent/openai";
import type { AgentEngine, ChatRequest } from "../agent/types";

function createEngine(): AgentEngine {
  return process.env.AGENT_ENGINE === "openai" ? new OpenAIEngine() : new RuleBasedEngine();
}

export const chatRouter = Router();

/** POST /api/chat —— SSE 流式返回 Agent 事件 */
chatRouter.post("/chat", async (req, res) => {
  const { message, userId } = (req.body ?? {}) as Partial<ChatRequest>;
  if (typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "message 不能为空" });
    return;
  }
  const request: ChatRequest = { message: message.trim(), userId: userId || "u_001" };

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const emit = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const engine = createEngine();
  try {
    await engine.run(request, emit);
  } catch (err) {
    emit("error", { message: err instanceof Error ? err.message : String(err) });
  }
  res.end();
});
