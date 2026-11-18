export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
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

export interface Order {
  orderId: string;
  userId: string;
  items: OrderItem[];
  status: string;
  logisticsNo: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
}

/** 助手消息由若干结构化片段组成，与 SSE 事件一一对应 */
export type Segment =
  | { kind: "thinking"; tool: string; label: string; done: boolean; summary?: string }
  | { kind: "text"; text: string }
  | { kind: "products"; products: Product[] }
  | { kind: "orders"; orders: Order[]; trace?: string[] }
  | { kind: "error"; text: string };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  segments: Segment[];
}
