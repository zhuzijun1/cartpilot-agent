import { getDb } from "../data/db";
import { detectPlan } from "./intent";
import { resolveProductRefs } from "./intent";
import { toolRegistry } from "./tools";
import type { AgentEngine, ChatRequest, EventEmitter, ToolContext, ToolResult } from "./types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function priceLine(p: { name: string; price: number; rating: number }): string {
  return `· ${p.name} — ¥${p.price}（评分 ${p.rating}）`;
}

/**
 * 规则引擎：意图路由 + 工具链调用 + 模板化文本生成。
 * 不依赖真实 LLM，但事件流与 OpenAIEngine 完全一致，前端无感知。
 */
export class RuleBasedEngine implements AgentEngine {
  readonly name = "rule-based";

  async run(req: ChatRequest, emit: EventEmitter): Promise<void> {
    const db = getDb();
    const ctx: ToolContext = { db };
    const plan = detectPlan(req.message, db.products);
    const replyParts: string[] = [];

    const call = async (tool: keyof typeof toolRegistry, params: Record<string, unknown>, label: string): Promise<ToolResult> => {
      emit("thinking", { tool, label });
      const result = await toolRegistry[tool].execute(params, ctx);
      emit("tool_result", { tool, ok: result.ok, summary: result.summary });
      return result;
    };

    emit("thinking", { tool: "intent", label: "正在理解你的需求…" });

    for (const intent of plan.intents) {
      switch (intent) {
        case "find_product": {
          const r = await call(
            "search_products",
            {
              keyword: plan.params.keyword,
              category: plan.params.category,
              minPrice: plan.params.minPrice,
              maxPrice: plan.params.maxPrice,
              sortBy: plan.params.sortBy ?? "rating_desc",
              limit: 6,
            },
            "正在搜索商品"
          );
          if (r.products?.length) {
            emit("product_cards", { products: r.products });
            replyParts.push(`${r.summary}：\n${r.products.slice(0, 4).map(priceLine).join("\n")}`);
          } else {
            replyParts.push("没有找到完全匹配的商品，可以换个关键词，或放宽价格区间再试试。");
          }
          break;
        }
        case "product_detail": {
          const refs = resolveProductRefs(req.message, db.products, 1);
          const target = refs[0];
          const r = await call(
            "get_product_detail",
            target ? { productId: target.id } : { name: plan.params.keyword ?? req.message },
            "正在查询商品详情"
          );
          const p = r.products?.[0];
          if (p) {
            emit("product_cards", { products: [p] });
            replyParts.push(
              `${p.name}（${p.brand} · ${p.category}）\n${p.description}\n当前售价 ¥${p.price}，用户评分 ${p.rating}，库存 ${p.stock} 件。`
            );
          } else {
            replyParts.push(r.summary);
          }
          break;
        }
        case "recommend": {
          const r = await call(
            "recommend",
            { category: plan.params.category, budget: plan.params.budget ?? plan.params.maxPrice, keyword: plan.params.keyword },
            "正在为你搭配推荐"
          );
          if (r.products?.length) {
            emit("product_cards", { products: r.products });
            const reasons = (r.extra?.reasons as string[] | undefined) ?? [];
            replyParts.push(`${r.summary}\n推荐理由：\n${reasons.map((x) => `· ${x}`).join("\n")}`);
          } else {
            replyParts.push(r.summary);
          }
          break;
        }
        case "compare": {
          const refs = resolveProductRefs(req.message, db.products, 3);
          const r = await call("compare_products", { ids: refs.map((p) => p.id) }, "正在对比商品");
          if (r.products && r.products.length >= 2) {
            emit("product_cards", { products: r.products });
            const rows = (r.extra?.rows as { label: string; values: string[] }[] | undefined) ?? [];
            replyParts.push(
              `${r.summary}\n${rows.map((row) => `· ${row.label}：${row.values.join(" ｜ ")}`).join("\n")}`
            );
          } else {
            replyParts.push("想对比的话，告诉我 2-3 件商品的名字，例如「AuroraPods Pro 和 Sonora H9 哪个好」。");
          }
          break;
        }
        case "order_query": {
          if (plan.params.orderIds?.length) {
            for (const orderId of plan.params.orderIds.slice(0, 2)) {
              const r = await call("get_order_status", { orderId }, "正在查询物流状态");
              if (r.orders?.length) {
                emit("order_table", { orders: r.orders, trace: r.extra?.trace });
                replyParts.push(r.summary);
              } else {
                replyParts.push(r.summary);
              }
            }
          } else {
            const r = await call("list_orders", { userId: req.userId }, "正在查询你的订单");
            if (r.orders?.length) {
              emit("order_table", { orders: r.orders });
              replyParts.push(
                `${r.summary}：\n${r.orders
                  .slice(0, 4)
                  .map((o) => `· ${o.orderId}（${o.createdAt}）${o.status}，共 ${o.items.length} 件商品`)
                  .join("\n")}`
              );
            } else {
              replyParts.push("你还没有下过订单，要不要我先帮你逛逛热卖商品？");
            }
          }
          break;
        }
        case "smalltalk": {
          replyParts.push(
            "你好，我是 CartPilot 导购助手 🛒\n我可以帮你：\n· 找商品（例：500 块以内评分高的蓝牙耳机）\n· 查订单与物流（例：查一下我的订单）\n· 搭配推荐（例：预算 800 推荐一套秋冬穿搭）\n· 商品对比（例：AuroraPods Pro 和 Sonora H9 哪个好）"
          );
          break;
        }
      }
    }

    const text = replyParts.join("\n\n");
    for (let i = 0; i < text.length; i += 6) {
      emit("token", { text: text.slice(i, i + 6) });
      await sleep(24);
    }
    emit("done", { engine: this.name, intents: plan.intents });
  }
}
