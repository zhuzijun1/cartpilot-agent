import type { Product, User } from "./types";

export interface ChatEvent {
  event: string;
  data: unknown;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} 失败：HTTP ${res.status}`);
  return (await res.json()) as T;
}

export async function fetchUsers(): Promise<User[]> {
  const data = await getJson<{ users: User[] }>("/api/users");
  return data.users;
}

export async function fetchProducts(): Promise<Product[]> {
  const data = await getJson<{ products: Product[] }>("/api/products");
  return data.products;
}

function parseFrame(frame: string): ChatEvent | null {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  if (!dataLines.length) return null;
  try {
    return { event, data: JSON.parse(dataLines.join("\n")) };
  } catch {
    return null;
  }
}

/** 以 POST 发起对话，手动解析 SSE 帧并逐事件回调 */
export async function streamChat(
  payload: { message: string; userId: string },
  onEvent: (e: ChatEvent) => void
): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok || !res.body) throw new Error(`POST /api/chat 失败：HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n\n")) >= 0) {
      const frame = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const parsed = parseFrame(frame);
      if (parsed) onEvent(parsed);
    }
  }
}
