import type { Order } from "../types";

const STATUS_CLASS: Record<string, string> = {
  待付款: "st-unpaid",
  已发货: "st-shipped",
  运输中: "st-transit",
  已完成: "st-done",
};

function orderTotal(o: Order): number {
  return o.items.reduce((s, it) => s + it.price * it.qty, 0);
}

interface Props {
  orders: Order[];
  trace?: string[];
}

export default function OrderTable({ orders, trace }: Props) {
  return (
    <div className="otable-wrap">
      <table className="otable">
        <thead>
          <tr>
            <th>订单号</th>
            <th>下单日期</th>
            <th>商品</th>
            <th>金额</th>
            <th>状态</th>
            <th>物流单号</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.orderId}>
              <td className="mono">{o.orderId}</td>
              <td>{o.createdAt}</td>
              <td>
                {o.items.map((it) => (
                  <div key={it.productId} className="oitem">
                    {it.name} × {it.qty}
                  </div>
                ))}
              </td>
              <td>¥{orderTotal(o)}</td>
              <td>
                <span className={`status-badge ${STATUS_CLASS[o.status] ?? ""}`}>{o.status}</span>
              </td>
              <td className="mono">{o.logisticsNo || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {trace && trace.length > 0 && (
        <ul className="trace">
          {trace.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
