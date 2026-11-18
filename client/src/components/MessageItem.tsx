import type { ChatMessage, Segment } from "../types";
import OrderTable from "./OrderTable";
import ProductCards from "./ProductCards";

function SegmentView({ s }: { s: Segment }) {
  switch (s.kind) {
    case "thinking":
      return (
        <div className={`thinking${s.done ? " done" : ""}`}>
          <span className="thinking-dot" />
          <span className="thinking-label">{s.done ? s.summary ?? s.label : s.label}</span>
          <code className="thinking-tool">{s.tool}</code>
        </div>
      );
    case "text":
      return <div className="msg-text">{s.text}</div>;
    case "products":
      return <ProductCards products={s.products} />;
    case "orders":
      return <OrderTable orders={s.orders} trace={s.trace} />;
    case "error":
      return <div className="msg-error">{s.text}</div>;
  }
}

export default function MessageItem({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="row user">
        <div className="bubble user-bubble">{message.segments.map((s) => (s.kind === "text" ? s.text : "")).join("")}</div>
      </div>
    );
  }
  const empty = message.segments.length === 0;
  return (
    <div className="row agent">
      <div className="bubble agent-bubble">
        {empty ? <div className="thinking"><span className="thinking-dot" /><span className="thinking-label">Agent 正在思考…</span></div> : null}
        {message.segments.map((s, i) => (
          <SegmentView key={i} s={s} />
        ))}
      </div>
    </div>
  );
}
