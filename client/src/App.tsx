import { useEffect, useMemo, useState } from "react";
import { fetchProducts, fetchUsers, streamChat, type ChatEvent } from "./api";
import CatalogPanel from "./components/CatalogPanel";
import ChatPanel from "./components/ChatPanel";
import UserSwitcher from "./components/UserSwitcher";
import type { ChatMessage, Order, Product, Segment, User } from "./types";

let seq = 0;
const nextId = () => `m_${Date.now()}_${++seq}`;

/** 将 SSE 事件折叠进助手消息的结构化片段列表 */
function applyEvent(segments: Segment[], e: ChatEvent): Segment[] {
  switch (e.event) {
    case "thinking": {
      const d = e.data as { tool: string; label: string };
      const closed = segments.map((s) => (s.kind === "thinking" ? { ...s, done: true } : s));
      return [...closed, { kind: "thinking", tool: d.tool, label: d.label, done: false }];
    }
    case "tool_result": {
      const d = e.data as { tool: string; ok: boolean; summary: string };
      const out = [...segments];
      for (let i = out.length - 1; i >= 0; i--) {
        const s = out[i];
        if (s.kind === "thinking" && s.tool === d.tool) {
          out[i] = { ...s, done: true, summary: d.summary };
          break;
        }
      }
      return out;
    }
    case "product_cards": {
      const d = e.data as { products: Product[] };
      return [...segments, { kind: "products", products: d.products }];
    }
    case "order_table": {
      const d = e.data as { orders: Order[]; trace?: string[] };
      return [...segments, { kind: "orders", orders: d.orders, trace: d.trace }];
    }
    case "token": {
      const d = e.data as { text: string };
      const last = segments[segments.length - 1];
      if (last && last.kind === "text") {
        return [...segments.slice(0, -1), { ...last, text: last.text + d.text }];
      }
      return [...segments, { kind: "text", text: d.text }];
    }
    case "error": {
      const d = e.data as { message?: string };
      return [...segments, { kind: "error", text: d.message ?? "Agent 执行出错" }];
    }
    case "done": {
      return segments.map((s) => (s.kind === "thinking" ? { ...s, done: true } : s));
    }
    default:
      return segments;
  }
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  segments: [
    {
      kind: "text",
      text:
        "你好，我是 CartPilot 购物助手 🛒\n可以帮你找商品、查订单物流、按预算做搭配推荐、对比商品。试试下方的快捷提问，或从左侧商品目录挑一件来问我。",
    },
  ],
};

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState("u_001");
  const [products, setProducts] = useState<Product[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(true);

  useEffect(() => {
    fetchUsers().then(setUsers).catch(() => setUsers([]));
    fetchProducts().then(setProducts).catch(() => setProducts([]));
  }, []);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || streaming) return;
    setInput("");
    const botId = nextId();
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", segments: [{ kind: "text", text }] },
      { id: botId, role: "assistant", segments: [] },
    ]);
    setStreaming(true);
    try {
      await streamChat({ message: text, userId: currentUserId }, (e) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === botId ? { ...m, segments: applyEvent(m.segments, e) } : m))
        );
      });
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId
            ? { ...m, segments: [...m.segments, { kind: "error", text: err instanceof Error ? err.message : String(err) }] }
            : m
        )
      );
    } finally {
      setStreaming(false);
    }
  };

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId),
    [users, currentUserId]
  );

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-badge">CP</span>
          <div>
            <div className="brand-name">CartPilot</div>
            <div className="brand-sub">电商智能导购 & 客服 Agent</div>
          </div>
        </div>
        <div className="topbar-right">
          <UserSwitcher users={users} value={currentUserId} onChange={setCurrentUserId} />
          <button
            className={`ghost-btn${catalogOpen ? " active" : ""}`}
            onClick={() => setCatalogOpen((v) => !v)}
          >
            {catalogOpen ? "隐藏目录" : "商品目录"}
          </button>
        </div>
      </header>

      <div className="layout">
        <CatalogPanel
          open={catalogOpen}
          products={products}
          onPick={(name) => {
            setInput(`介绍一下 ${name}`);
          }}
        />
        <ChatPanel
          messages={messages}
          streaming={streaming}
          userName={currentUser?.name ?? "访客"}
          input={input}
          onInputChange={setInput}
          onSend={send}
        />
      </div>
    </div>
  );
}
