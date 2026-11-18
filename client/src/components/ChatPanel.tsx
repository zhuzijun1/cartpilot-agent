import { useEffect, useRef } from "react";
import type { ChatMessage } from "../types";
import MessageItem from "./MessageItem";

const QUICK_CHIPS = [
  "500块以内评分高的蓝牙耳机",
  "查一下我的订单",
  "预算800推荐一套秋冬穿搭",
  "AuroraPods Pro 和 Sonora H9 哪个好",
  "介绍一下 Lumen Mini 便携蓝牙音箱",
];

interface Props {
  messages: ChatMessage[];
  streaming: boolean;
  userName: string;
  input: string;
  onInputChange: (v: string) => void;
  onSend: (text: string) => void;
}

export default function ChatPanel({ messages, streaming, userName, input, onInputChange, onSend }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <main className="chat">
      <div className="chat-hint">
        当前身份：<b>{userName}</b> · Agent 会通过工具查询商品目录与订单数据
      </div>
      <div className="messages" ref={scrollRef}>
        {messages.map((m) => (
          <MessageItem key={m.id} message={m} />
        ))}
      </div>
      <div className="chips">
        {QUICK_CHIPS.map((c) => (
          <button key={c} className="chip" disabled={streaming} onClick={() => onSend(c)}>
            {c}
          </button>
        ))}
      </div>
      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          onSend(input);
        }}
      >
        <input
          value={input}
          placeholder="问我任何购物问题，例如：有没有 300 以内的音箱？"
          onChange={(e) => onInputChange(e.target.value)}
        />
        <button type="submit" disabled={streaming || !input.trim()}>
          {streaming ? "回答中…" : "发送"}
        </button>
      </form>
    </main>
  );
}
