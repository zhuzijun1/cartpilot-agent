/** 领域模型 */

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: "数码" | "家居" | "服饰" | "美妆" | "食品";
  price: number;
  rating: number;
  stock: number;
  tags: string[];
  description: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
}

export type OrderStatus = "待付款" | "已发货" | "运输中" | "已完成";

export interface Order {
  orderId: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  logisticsNo: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
}

export interface Database {
  products: Product[];
  orders: Order[];
  users: User[];
}

/** 工具层 */

export interface ToolContext {
  db: Database;
}

export interface ToolResult {
  ok: boolean;
  /** 给 Agent 文本层使用的一句话摘要 */
  summary: string;
  products?: Product[];
  orders?: Order[];
  /** 结构化的附加数据（如对比表、推荐理由） */
  extra?: Record<string, unknown>;
}

export interface ToolParamSpec {
  type: "string" | "number" | "array";
  description: string;
  required?: boolean;
}

/** 统一的 Agent 工具接口：name / description / parameters / execute */
export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, ToolParamSpec>;
  execute(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult>;
}

/** Agent 引擎层 */

export interface ChatRequest {
  message: string;
  userId: string;
}

/** SSE 事件发射器：event 名 + 可序列化数据 */
export type EventEmitter = (event: string, data: unknown) => void;

export interface AgentEngine {
  readonly name: string;
  run(req: ChatRequest, emit: EventEmitter): Promise<void>;
}
