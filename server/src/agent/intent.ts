import type { Product } from "./types";

/** 意图类型：找商品 / 看详情 / 要推荐 / 比价 / 查订单 / 闲聊兜底 */
export type IntentKind =
  | "find_product"
  | "product_detail"
  | "recommend"
  | "compare"
  | "order_query"
  | "smalltalk";

export interface IntentParams {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "rating_desc" | "price_asc" | "price_desc";
  budget?: number;
  orderIds?: string[];
  /** 消息中提到的商品引用（用于详情/对比） */
  productRefs?: string[];
}

export interface IntentPlan {
  intents: IntentKind[];
  params: IntentParams;
}

const CATEGORIES = ["数码", "家居", "服饰", "美妆", "食品"];

/** 常见商品名词 → 搜索关键词 */
const PRODUCT_TERMS = [
  "蓝牙耳机", "耳机", "音箱", "手表", "键盘", "充电宝", "移动电源",
  "台灯", "加湿器", "沙发", "床品", "四件套", "榨汁",
  "外套", "T恤", "t恤", "牛仔裤", "围巾",
  "洁面", "精华", "唇釉", "口红",
  "咖啡", "坚果", "草莓", "零食",
];

const RE_ORDER = /(订单|物流|快递|发货|签收|运单|买了(什么|啥)?|上次买|买过|我的.*单)/;
const RE_ORDER_ID = /(o_\d{8}_\d{3,})/i;
const RE_COMPARE = /(对比|比较|哪个(更|好|值)|区别|差别|vs|VS|Vs|PK|pk)/;
const RE_DETAIL = /(介绍一下|了解一?下|详情|参数|怎么样|值得买|好用吗)/;
const RE_RECOMMEND = /(推荐|搭配|组合|预算|怎么选|帮我挑|买点什么|送什么|来一套)/;
const RE_FIND = /(找|搜|有没有|想要|想买|看看|来一?[个件台只套双瓶盒袋杯]|需要|求一?个?|想买点)/;
const RE_SMALLTALK = /(你好|您好|嗨|哈喽|hello|hi|你是谁|能做什么|会什么|有什么功能|帮助|help|谢谢)/i;
const RE_RATING = /(评分高|评价好|口碑|好评|高分)/;
const RE_CHEAP = /(便宜|价格低|实惠|性价比)/;
const RE_PRICE = /(贵|高端|旗舰)/;

function extractPrice(message: string): { min?: number; max?: number; budget?: number } {
  const budget = /预算\s*(\d{2,6})/.exec(message)?.[1];
  const within = /(\d{2,6})\s*(?:元|块|¥)?\s*(?:以内|以下|之内)/.exec(message)?.[1];
  const range = /(\d{2,6})\s*[-~到至]\s*(\d{2,6})/.exec(message);
  return {
    budget: budget ? Number(budget) : undefined,
    max: within ? Number(within) : range ? Number(range[2]) : undefined,
    min: range ? Number(range[1]) : undefined,
  };
}

function extractKeyword(message: string): string | undefined {
  for (const term of PRODUCT_TERMS) {
    if (message.toLowerCase().includes(term.toLowerCase())) return term.toLowerCase() === "t恤" ? "T恤" : term;
  }
  return undefined;
}

function extractCategory(message: string): string | undefined {
  for (const c of CATEGORIES) if (message.includes(c)) return c;
  if (/(穿搭|通勤|秋冬|夏季|穿衣)/.test(message)) return "服饰";
  if (/(护肤|化妆|彩妆)/.test(message)) return "美妆";
  return undefined;
}

/** 按品牌 + 型号 token 给单个文本片段打分，返回最匹配的商品 */
function bestMatch(fragment: string, products: Product[]): Product | undefined {
  const msg = fragment.toLowerCase();
  let best: { p: Product; score: number } | undefined;
  for (const p of products) {
    let score = 0;
    if (msg.includes(p.brand.toLowerCase())) score += 2;
    // 名称中的英文/数字型号 token（如 H9、Pro、Air、S2、K75）
    for (const t of p.name.match(/[A-Za-z][A-Za-z0-9]+/g) ?? []) {
      if (msg.includes(t.toLowerCase())) score += 3;
    }
    if (msg.includes(p.name.toLowerCase())) score += 6;
    if (score >= 3 && (!best || score > best.score)) best = { p, score };
  }
  return best?.p;
}

/** 从消息中解析被点名的商品，供详情/对比使用 */
export function resolveProductRefs(message: string, products: Product[], max = 3): Product[] {
  // 先按连接词分段（"A 和 B 哪个好" → 分别解析 A、B），再整体兜底
  const segments = message.split(/(?:和|与|跟|、|,|,|vs|VS|versus| compared? to|对比|比较)/i).filter((s) => s.trim());
  const picked: Product[] = [];
  for (const seg of segments) {
    const hit = bestMatch(seg, products);
    if (hit && !picked.some((p) => p.id === hit.id)) picked.push(hit);
    if (picked.length >= max) return picked;
  }
  if (!picked.length) {
    const hit = bestMatch(message, products);
    if (hit) picked.push(hit);
  }
  return picked;
}

/** 关键词 + 正则意图识别，一次消息可命中多个意图（工具链串联） */
export function detectPlan(message: string, products: Product[]): IntentPlan {
  const params: IntentParams = {};
  const price = extractPrice(message);
  params.keyword = extractKeyword(message);
  params.category = extractCategory(message);
  params.minPrice = price.min;
  params.maxPrice = price.max;
  params.budget = price.budget;

  if (RE_RATING.test(message)) params.sortBy = "rating_desc";
  else if (RE_CHEAP.test(message)) params.sortBy = "price_asc";
  else if (RE_PRICE.test(message)) params.sortBy = "price_desc";

  const orderIds = [...message.matchAll(new RegExp(RE_ORDER_ID, "gi"))].map((m) => m[1]);
  if (orderIds.length) params.orderIds = orderIds;

  const hasSearchable = Boolean(params.keyword || params.category || price.max || price.min || price.budget);

  const intents: IntentKind[] = [];
  const refs = resolveProductRefs(message, products);
  if (refs.length) params.productRefs = refs.map((p) => p.name);

  const isCompare = RE_COMPARE.test(message);
  const isRecommend = RE_RECOMMEND.test(message);
  const isDetail = RE_DETAIL.test(message);
  const isOrder = RE_ORDER.test(message) || orderIds.length > 0;
  const isFind = RE_FIND.test(message);

  if (isCompare) intents.push("compare");
  if (isDetail && (refs.length || params.keyword)) intents.push("product_detail");
  if (isRecommend) intents.push("recommend");
  else if (isFind || (!isOrder && !isDetail && !isCompare && hasSearchable)) intents.push("find_product");
  if (isOrder) intents.push("order_query");

  if (!intents.length) {
    // 纯商品名/关键词也可视作找商品；否则闲聊兜底
    intents.push(refs.length || params.keyword ? "find_product" : "smalltalk");
  }
  return { intents, params };
}
