import { useMemo, useState } from "react";
import type { Product } from "../types";

interface Props {
  open: boolean;
  products: Product[];
  onPick: (name: string) => void;
}

const CATEGORIES = ["全部", "数码", "家居", "服饰", "美妆", "食品"];

export default function CatalogPanel({ open, products, onPick }: Props) {
  const [category, setCategory] = useState("全部");
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "全部" && p.category !== category) return false;
      if (!kw) return true;
      return [p.name, p.brand, ...p.tags].join(" ").toLowerCase().includes(kw);
    });
  }, [products, category, keyword]);

  if (!open) return null;

  return (
    <aside className="catalog">
      <div className="catalog-head">
        <h2>商品目录</h2>
        <span className="catalog-count">{filtered.length} 件</span>
      </div>
      <input
        className="catalog-search"
        placeholder="搜索商品 / 品牌 / 标签"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <div className="catalog-cats">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`cat-chip${category === c ? " active" : ""}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="catalog-list">
        {filtered.map((p) => (
          <button key={p.id} className="catalog-item" onClick={() => onPick(p.name)} title="点击向助手提问">
            <span className="catalog-thumb" style={{ background: thumbColor(p.id) }}>
              {p.brand.slice(0, 1)}
            </span>
            <span className="catalog-info">
              <span className="catalog-name">{p.name}</span>
              <span className="catalog-meta">
                <em className="catalog-price">¥{p.price}</em>
                <span>★ {p.rating}</span>
                <span className="catalog-cat">{p.category}</span>
              </span>
            </span>
          </button>
        ))}
        {filtered.length === 0 && <div className="catalog-empty">没有匹配的商品</div>}
      </div>
    </aside>
  );
}

/** 由商品 id 派生稳定的占位色 */
export function thumbColor(id: string): string {
  const palette = ["#ffd9c8", "#cfe8ff", "#e2f4d9", "#fff0c2", "#e8dcff", "#ffd6e0", "#d0f0ee", "#f3e3cf"];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}
