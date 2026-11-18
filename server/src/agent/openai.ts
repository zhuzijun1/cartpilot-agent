import { allTools } from "./tools";
import type { AgentEngine, ChatRequest, EventEmitter } from "./types";

/**
 * OpenAI / 兼容 Chat Completions 协议的引擎骨架。
 * 通过环境变量启用：AGENT_ENGINE=openai，并配置 OPENAI_API_KEY 等。
 * 当前仅提供接口与工具 schema 组装，函数调用闭环为 TODO。
 */
export class OpenAIEngine implements AgentEngine {
  readonly name = "openai";
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY ?? "";
    this.baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
    this.model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  }

  /** 将 AgentTool 注册表转换为 OpenAI function calling 的 tools 参数 */
  private buildToolSchemas() {
    return allTools.map((t) => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: {
          type: "object",
          properties: Object.fromEntries(
            Object.entries(t.parameters).map(([k, v]) => [k, { type: v.type, description: v.description }])
          ),
          required: Object.entries(t.parameters)
            .filter(([, v]) => v.required)
            .map(([k]) => k),
        },
      },
    }));
  }

  async run(req: ChatRequest, emit: EventEmitter): Promise<void> {
    if (!this.apiKey) {
      throw new Error("OpenAIEngine 缺少 OPENAI_API_KEY，请改用规则引擎（默认）或配置环境变量");
    }
    // TODO: 1) 组装 system prompt（注入当前 userId、日期、导购人设）与本 buildToolSchemas() 结果
    // TODO: 2) 调用 ${this.baseUrl}/chat/completions（stream: true），model = this.model
    // TODO: 3) 解析 delta.tool_calls：先 emit("thinking", {tool, label})，执行对应 AgentTool 后
    //         emit("tool_result")，商品/订单分别 emit("product_cards") / ("order_table")，
    //         再把工具结果以 role=tool 消息回填，继续下一轮模型调用
    // TODO: 4) 将正文 delta 逐段 emit("token")，结束后 emit("done")
    void emit;
    void req;
    throw new Error("OpenAIEngine 尚未实现完整调用，请设置 AGENT_ENGINE=rule 使用规则引擎");
  }
}
