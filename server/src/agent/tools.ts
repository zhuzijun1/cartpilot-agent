import type { AgentTool, Order, Product, ToolContext, ToolResult } from "./types";

type SortKey = "rating_desc" | "price_asc" | "price_desc";

function applySort(list: Product[], sortBy?: string): Product[] {
  const out = [...list];
  switch (sortBy as SortKey) {
    case "price_asc":
      out.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      out.sort((a, b) => b.price - a.price);
      break;
    default:
      out.sort((a, b) => b.rating - a.rating || b.stock - a.stock);
  }
  return out;
}

function matchKeyword(p: Product, keyword: string): boolean {
  const kw = keyword.toLowerCase();
  const hay = [p.name, p.brand, p.category, p.description, ...p.tags].join(" ").toLowerCase();
  // 逐词（按空格/标点拆分）匹配，全部命中才算命中
  return kw
    .split(/[\s,，、]+/)
    .filter(Boolean)
    .every((token) => hay.includes(token));
}

/** 按名称/品牌模糊解析商品（供 detail / compare 使用） */
export function findProductsByName(db: ToolContext["db"], names: string[], limit = 3): Product[] {
  const picked: Product[] = [];
  for (const raw of names) {
    const n = raw.trim().toLowerCase();
    if (!n) continue;
    const hit = db.products.find(
      (p) =>
        p.name.toLowerCase().includes(n) ||
        n.includes(p.brand.toLowerCase()) ||
        p.tags.some((t) => n.includes(t.toLowerCase()))
    );
    if (hit && !picked.some((x) => x.id === hit.id)) picked.push(hit);
    if (picked.length >= limit) break;
  }
  return picked;
}

const searchProducts: AgentTool = {
  name: "search_products",
  description: "按关键词、品类、价格区间、标签检索商品，支持按价格或评分排序",
  parameters: {
    keyword: { type: "string", description: "搜索关键词，匹配名称/品牌/标签/描述" },
    category: { type: "string", description: "品类：数码/家居/服饰/美妆/食品" },
    minPrice: { type: "number", description: "最低价格（元）" },
    maxPrice: { type: "number", description: "最高价格（元）" },
    tags: { type: "array", description: "标签列表，命中其一即可" },
    sortBy: { type: "string", description: "排序：rating_desc / price_asc / price_desc" },
    limit: { type: "number", description: "返回条数，默认 6" },
  },
  async execute(params, ctx): Promise<ToolResult> {
    const { keyword, category, minPrice, maxPrice, sortBy } = params as Record<string, number | string | undefined>;
    const tags = (params.tags as string[] | undefined) ?? [];
    let list = ctx.db.products;
    if (typeof category === "string" && category) list = list.filter((p) => p.category === category);
    if (typeof keyword === "string" && keyword) list = list.filter((p) => matchKeyword(p, keyword));
    if (tags.length) list = list.filter((p) => p.tags.some((t) => tags.includes(t)));
    if (typeof minPrice === "number") list = list.filter((p) => p.price >= minPrice);
    if (typeof maxPrice === "number") list = list.filter((p) => p.price <= maxPrice);
    const limit = typeof params.limit === "number" ? params.limit : 6;
    const sorted = applySort(list, typeof sortBy === "string" ? sortBy : undefined);
    const top = sorted.slice(0, limit);
    return {
      ok: top.length > 0,
      summary: top.length ? `找到 ${top.length} 件符合条件的商品` : "没有找到符合条件的商品",
      products: top,
    };
  },
};

const getProductDetail: AgentTool = {
  name: "get_product_detail",
  description: "查询单个商品的详细信息（按商品 id 或名称）",
  parameters: {
    productId: { type: "string", description: "商品 id，如 p_001" },
    name: { type: "string", description: "商品名称或品牌关键词" },
  },
  async execute(params, ctx): Promise<ToolResult> {
    const byId = params.productId
      ? ctx.db.products.find((p) => p.id === params.productId)
      : undefined;
    const byName = !byId && params.name ? findProductsByName(ctx.db, [String(params.name)], 1)[0] : undefined;
    const product = byId ?? byName;
    if (!product) return { ok: false, summary: `未找到商品「${params.name ?? params.productId}」` };
    return { ok: true, summary: `已获取《${product.name}》的详情`, products: [product] };
  },
};

const listOrders: AgentTool = {
  name: "list_orders",
  description: "查询指定用户的订单列表，按下单时间倒序",
  parameters: {
    userId: { type: "string", description: "用户 id，如 u_001", required: true },
    status: { type: "string", description: "可选，按订单状态过滤" },
  },
  async execute(params, ctx): Promise<ToolResult> {
    const userId = String(params.userId ?? "");
    let orders = ctx.db.orders.filter((o) => o.userId === userId);
    if (typeof params.status === "string" && params.status) {
      orders = orders.filter((o) => o.status === params.status);
    }
    orders = orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const user = ctx.db.users.find((u) => u.id === userId);
    return {
      ok: orders.length > 0,
      summary: orders.length
        ? `${user?.name ?? userId} 共有 ${orders.length} 笔订单`
        : `${user?.name ?? userId} 暂无订单记录`,
      orders,
    };
  },
};

/** 依据状态生成模拟物流轨迹 */
function buildTrace(order: Order): string[] {
  const base = order.createdAt;
  switch (order.status) {
    case "待付款":
      return [`${base} 订单创建成功，等待买家付款`];
    case "已发货":
      return [`${base} 商家已发货，运单号 ${order.logisticsNo}`, `${base} 包裹等待快递揽收`];
    case "运输中":
      return [
        `${base} 商家已发货，运单号 ${order.logisticsNo}`,
        `${base} 快件已从分拣中心发出，下一站：本市转运中心`,
      ];
    case "已完成":
      return [
        `${base} 商家已发货，运单号 ${order.logisticsNo}`,
        `${base} 包裹已签收，感谢使用，期待再次光临`,
      ];
  }
}

const getOrderStatus: AgentTool = {
  name: "get_order_status",
  description: "按订单号查询订单状态与物流轨迹",
  parameters: {
    orderId: { type: "string", description: "订单号，如 o_20260211_002", required: true },
  },
  async execute(params, ctx): Promise<ToolResult> {
    const orderId = String(params.orderId ?? "").trim();
    const order = ctx.db.orders.find((o) => o.orderId === orderId);
    if (!order) return { ok: false, summary: `未找到订单 ${orderId}，请确认订单号` };
    return {
      ok: true,
      summary: `订单 ${order.orderId} 当前状态：${order.status}`,
      orders: [order],
      extra: { trace: buildTrace(order) },
    };
  },
};

const recommend: AgentTool = {
  name: "recommend",
  description: "基于品类和预算给出 3 件商品组合推荐，并附推荐理由",
  parameters: {
    category: { type: "string", description: "偏好品类，如 数码/服饰" },
    budget: { type: "number", description: "总预算（元），可选" },
    keyword: { type: "string", description: "主题关键词，如 秋冬、通勤" },
  },
  async execute(params, ctx): Promise<ToolResult> {
    const budget = typeof params.budget === "number" ? params.budget : undefined;
    const category = typeof params.category === "string" ? params.category : undefined;
    const keyword = typeof params.keyword === "string" ? params.keyword : undefined;

    let pool = [...ctx.db.products];
    if (keyword) pool = pool.filter((p) => matchKeyword(p, keyword) || p.category === keyword);
    if (category) {
      const inCat = pool.filter((p) => p.category === category);
      // 品类内不足 3 件时，用其他品类的高分商品补齐组合
      pool = inCat.length >= 3 ? inCat : [...inCat, ...pool.filter((p) => p.category !== category)];
    }
    if (budget) pool = pool.filter((p) => p.price <= budget);
    pool.sort((a, b) => b.rating - a.rating);

    // 贪心挑选：优先不同品类/不同标签，凑 3 件且总价不超预算
    const picked: Product[] = [];
    for (const p of pool) {
      if (picked.length >= 3) break;
      if (picked.some((x) => x.category === p.category) && pool.length > 3) continue;
      const total = picked.reduce((s, x) => s + x.price, 0) + p.price;
      if (budget && picked.length > 0 && total > budget) continue;
      picked.push(p);
    }
    while (picked.length < 3 && pool.length) {
      const next = pool.find((p) => !picked.includes(p));
      if (!next) break;
      picked.push(next);
    }
    if (!picked.length) return { ok: false, summary: "预算或条件太紧，没有找到合适的组合，试着放宽条件" };

    const total = picked.reduce((s, p) => s + p.price, 0);
    const reasons = picked.map(
      (p) => `${p.name}（¥${p.price}）：评分 ${p.rating}，${p.tags.slice(0, 2).join(" / ")}`
    );
    return {
      ok: true,
      summary: `为你搭配了 ${picked.length} 件商品，合计 ¥${total}${budget ? `，预算 ¥${budget} 内` : ""}`,
      products: picked,
      extra: { reasons, total },
    };
  },
};

const compareProducts: AgentTool = {
  name: "compare_products",
  description: "对比 2-3 件商品的价格、评分、卖点，返回表格数据",
  parameters: {
    ids: { type: "array", description: "商品 id 列表（2-3 个）", required: true },
  },
  async execute(params, ctx): Promise<ToolResult> {
    const ids = (params.ids as string[] | undefined) ?? [];
    const products = ids
      .map((id) => ctx.db.products.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p))
      .slice(0, 3);
    if (products.length < 2) return { ok: false, summary: "对比至少需要 2 件有效商品" };
    const rows = [
      { label: "价格", values: products.map((p) => `¥${p.price}`) },
      { label: "评分", values: products.map((p) => `${p.rating}`) },
      { label: "品牌", values: products.map((p) => p.brand) },
      { label: "品类", values: products.map((p) => p.category) },
      { label: "卖点", values: products.map((p) => p.tags.slice(0, 3).join("、")) },
      { label: "一句话介绍", values: products.map((p) => p.description) },
    ];
    const cheapest = products.reduce((a, b) => (a.price <= b.price ? a : b));
    const best = products.reduce((a, b) => (a.rating >= b.rating ? a : b));
    return {
      ok: true,
      summary: `已对比 ${products.length} 件商品：${cheapest.name} 价格最低，${best.name} 评分最高`,
      products,
      extra: { rows },
    };
  },
};

export const toolRegistry: Record<string, AgentTool> = {
  search_products: searchProducts,
  get_product_detail: getProductDetail,
  list_orders: listOrders,
  get_order_status: getOrderStatus,
  recommend,
  compare_products: compareProducts,
};

export const allTools: AgentTool[] = Object.values(toolRegistry);
