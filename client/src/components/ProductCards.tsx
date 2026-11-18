import type { Product } from "../types";
import { thumbColor } from "./CatalogPanel";

export default function ProductCards({ products }: { products: Product[] }) {
  return (
    <div className="pcards">
      {products.map((p) => (
        <div key={p.id} className="pcard">
          <div className="pcard-thumb" style={{ background: thumbColor(p.id) }}>
            <span className="pcard-letter">{p.brand.slice(0, 1)}</span>
            <span className="pcard-cat">{p.category}</span>
          </div>
          <div className="pcard-body">
            <div className="pcard-name" title={p.name}>
              {p.name}
            </div>
            <div className="pcard-desc">{p.description}</div>
            <div className="pcard-tags">
              {p.tags.slice(0, 3).map((t) => (
                <span key={t} className="ptag">
                  {t}
                </span>
              ))}
            </div>
            <div className="pcard-foot">
              <span className="pcard-price">¥{p.price}</span>
              <span className="pcard-rate">★ {p.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
