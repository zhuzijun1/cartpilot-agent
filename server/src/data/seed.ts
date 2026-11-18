import type { Order, Product, User } from "../agent/types";

/** 演示用户 */
export const seedUsers: User[] = [
  { id: "u_001", name: "张伟" },
  { id: "u_002", name: "李娜" },
  { id: "u_003", name: "王强" },
];

/** 商品种子数据（品牌与商品均为虚构） */
export const seedProducts: Product[] = [
  // —— 数码 ——
  { id: "p_001", name: "AuroraPods Pro 真无线降噪耳机", brand: "Aurora", category: "数码", price: 499, rating: 4.8, stock: 120, tags: ["耳机", "蓝牙", "降噪", "数码"], description: "主动降噪深度 42dB，单次续航 8 小时，支持低延迟游戏模式与无线充电。" },
  { id: "p_002", name: "AuroraPods Air 半入耳蓝牙耳机", brand: "Aurora", category: "数码", price: 299, rating: 4.6, stock: 300, tags: ["耳机", "蓝牙", "轻便", "数码"], description: "单耳仅 3.9g，长时间佩戴无压迫感，人声调校清晰，适合通勤与通话。" },
  { id: "p_003", name: "Sonora H9 头戴式降噪耳机", brand: "Sonora", category: "数码", price: 1299, rating: 4.9, stock: 45, tags: ["耳机", "降噪", "头戴", "HiFi"], description: "旗舰级动圈单元与混合降噪，支持 LDAC 高清传输，佩戴记忆棉耳罩。" },
  { id: "p_004", name: "Novabe S2 智能手表", brand: "Novabe", category: "数码", price: 899, rating: 4.5, stock: 80, tags: ["手表", "智能穿戴", "健康监测"], description: "血氧、心率、睡眠全天候监测，14 天续航，支持 120+ 运动模式。" },
  { id: "p_005", name: "Lumen Mini 便携蓝牙音箱", brand: "Lumen", category: "数码", price: 199, rating: 4.7, stock: 260, tags: ["音箱", "蓝牙", "便携", "户外"], description: "IPX7 防水，掌心大小却拥有 360° 环绕声场，户外露营首选。" },
  { id: "p_006", name: "Lumen Studio 桌面音箱", brand: "Lumen", category: "数码", price: 699, rating: 4.4, stock: 60, tags: ["音箱", "桌面", "HiFi"], description: "二分频桌面监听音箱，木质箱体降低谐振，适合影音与轻度创作。" },
  { id: "p_007", name: "Nimbus 20000mAh 移动电源", brand: "Nimbus", category: "数码", price: 149, rating: 4.5, stock: 400, tags: ["充电宝", "便携", "快充"], description: "22.5W 快充，双 USB-C 加 USB-A 三口输出，可上飞机。" },
  { id: "p_008", name: "Corva K75 机械键盘", brand: "Corva", category: "数码", price: 459, rating: 4.6, stock: 90, tags: ["键盘", "机械", "外设"], description: "75% 配列三模连接，Gasket 结构手感软弹，支持热插拔轴体。" },
  // —— 家居 ——
  { id: "p_009", name: "Terra 香薰加湿器", brand: "Terra", category: "家居", price: 229, rating: 4.7, stock: 150, tags: ["加湿器", "香薰", "卧室"], description: "4L 大水箱静音运行，可滴入精油，夜灯模式营造助眠氛围。" },
  { id: "p_010", name: "Willow 懒人沙发", brand: "Willow", category: "家居", price: 899, rating: 4.3, stock: 30, tags: ["沙发", "客厅", "休闲"], description: "高密度粒子填充自适应坐姿，可拆洗外套，窝进去就不想起来。" },
  { id: "p_011", name: "Halcyon Halo 智能台灯", brand: "Halcyon", category: "家居", price: 329, rating: 4.8, stock: 110, tags: ["台灯", "护眼", "智能"], description: "RG0 无蓝光危害，自动感光调亮，App 定时与番茄钟模式。" },
  { id: "p_012", name: "Mistral 长绒棉四件套", brand: "Mistral", category: "家居", price: 399, rating: 4.4, stock: 70, tags: ["床品", "家纺", "四件套"], description: "60 支长绒棉，丝滑亲肤透气，多色可选，机洗不褪色。" },
  { id: "p_013", name: "Brio 便携榨汁杯", brand: "Brio", category: "家居", price: 169, rating: 4.2, stock: 200, tags: ["榨汁机", "厨房", "便携"], description: "380ml 随行杯身，40 秒快速出汁，磁吸充电，一杯双盖。" },
  // —— 服饰 ——
  { id: "p_014", name: "Zephyr 轻量防风外套", brand: "Zephyr", category: "服饰", price: 359, rating: 4.6, stock: 85, tags: ["外套", "防风", "户外", "秋冬"], description: "三层复合面料防风防泼水，整衣仅 280g，可收纳进随身口袋。" },
  { id: "p_015", name: "Onyx 纯棉圆领T恤", brand: "Onyx", category: "服饰", price: 99, rating: 4.5, stock: 500, tags: ["T恤", "纯棉", "基础款"], description: "220g 重磅纯棉不易变形，六色基础款，衣橱百搭底色。" },
  { id: "p_016", name: "Kaelo 直筒牛仔裤", brand: "Kaelo", category: "服饰", price: 289, rating: 4.3, stock: 140, tags: ["牛仔裤", "通勤", "百搭"], description: "微弹斜纹牛仔布，直筒版型修饰腿型，通勤休闲两相宜。" },
  { id: "p_017", name: "Fable 羊毛混纺围巾", brand: "Fable", category: "服饰", price: 199, rating: 4.7, stock: 60, tags: ["围巾", "保暖", "秋冬"], description: "30% 羊毛混纺柔软不扎肤，流苏收边，礼盒装适合送礼。" },
  // —— 美妆 ——
  { id: "p_018", name: "Plumo 氨基酸洁面乳", brand: "Plumo", category: "美妆", price: 89, rating: 4.8, stock: 320, tags: ["洁面", "护肤", "温和"], description: "氨基酸表活温和清洁，泡沫绵密不紧绷，敏感肌可用。" },
  { id: "p_019", name: "Solace 烟酰胺精华液", brand: "Solace", category: "美妆", price: 259, rating: 4.6, stock: 180, tags: ["精华", "护肤", "提亮"], description: "5% 烟酰胺复配泛醇，提亮肤色同时修护屏障，质地清爽。" },
  { id: "p_020", name: "Verano 丝绒哑光唇釉", brand: "Verano", category: "美妆", price: 139, rating: 4.4, stock: 210, tags: ["口红", "彩妆", "哑光"], description: "轻薄丝绒质地不拔干，持色 8 小时，热门色号 #521 豆沙红棕。" },
  // —— 食品 ——
  { id: "p_021", name: "Mochi 冻干草莓脆", brand: "Mochi", category: "食品", price: 49, rating: 4.7, stock: 600, tags: ["零食", "果干", "冻干"], description: "整颗草莓 FD 冻干锁香，0 添加蔗糖，酸甜酥脆办公室小零食。" },
  { id: "p_022", name: "Quill 挂耳咖啡礼盒", brand: "Quill", category: "食品", price: 128, rating: 4.5, stock: 240, tags: ["咖啡", "礼盒", "饮品"], description: "四产区各 5 包共 20 包，中浅烘焙现烘现磨，附风味卡片。" },
  { id: "p_023", name: "Wren 每日坚果混合装", brand: "Wren", category: "食品", price: 89, rating: 4.6, stock: 350, tags: ["坚果", "零食", "健康"], description: "7 种坚果果干独立小包，每日一袋，科学配比无盐焗工艺。" },
];

/** 订单种子数据（与商品 id 关联） */
export const seedOrders: Order[] = [
  {
    orderId: "o_20260105_001", userId: "u_001", status: "已完成",
    logisticsNo: "SF7712098834102", createdAt: "2026-01-05",
    items: [{ productId: "p_002", name: "AuroraPods Air 半入耳蓝牙耳机", qty: 1, price: 299 }],
  },
  {
    orderId: "o_20260211_002", userId: "u_001", status: "运输中",
    logisticsNo: "YT9823410055671", createdAt: "2026-02-11",
    items: [
      { productId: "p_001", name: "AuroraPods Pro 真无线降噪耳机", qty: 1, price: 499 },
      { productId: "p_007", name: "Nimbus 20000mAh 移动电源", qty: 1, price: 149 },
    ],
  },
  {
    orderId: "o_20260228_003", userId: "u_001", status: "已发货",
    logisticsNo: "ZTO3366778890012", createdAt: "2026-02-28",
    items: [{ productId: "p_011", name: "Halcyon Halo 智能台灯", qty: 1, price: 329 }],
  },
  {
    orderId: "o_20260301_004", userId: "u_002", status: "待付款",
    logisticsNo: "", createdAt: "2026-03-01",
    items: [
      { productId: "p_018", name: "Plumo 氨基酸洁面乳", qty: 2, price: 89 },
      { productId: "p_019", name: "Solace 烟酰胺精华液", qty: 1, price: 259 },
    ],
  },
  {
    orderId: "o_20260308_005", userId: "u_002", status: "已完成",
    logisticsNo: "JD9912003344556", createdAt: "2026-03-08",
    items: [
      { productId: "p_009", name: "Terra 香薰加湿器", qty: 1, price: 229 },
      { productId: "p_017", name: "Fable 羊毛混纺围巾", qty: 1, price: 199 },
    ],
  },
  {
    orderId: "o_20260312_006", userId: "u_002", status: "运输中",
    logisticsNo: "STO6600991122334", createdAt: "2026-03-12",
    items: [{ productId: "p_020", name: "Verano 丝绒哑光唇釉", qty: 1, price: 139 }],
  },
  {
    orderId: "o_20260315_007", userId: "u_003", status: "已发货",
    logisticsNo: "SF7712666008877", createdAt: "2026-03-15",
    items: [{ productId: "p_003", name: "Sonora H9 头戴式降噪耳机", qty: 1, price: 1299 }],
  },
  {
    orderId: "o_20260317_008", userId: "u_003", status: "已完成",
    logisticsNo: "YT9823000111222", createdAt: "2026-03-17",
    items: [
      { productId: "p_022", name: "Quill 挂耳咖啡礼盒", qty: 1, price: 128 },
      { productId: "p_021", name: "Mochi 冻干草莓脆", qty: 2, price: 49 },
    ],
  },
  {
    orderId: "o_20260320_009", userId: "u_003", status: "待付款",
    logisticsNo: "", createdAt: "2026-03-20",
    items: [
      { productId: "p_014", name: "Zephyr 轻量防风外套", qty: 1, price: 359 },
      { productId: "p_016", name: "Kaelo 直筒牛仔裤", qty: 1, price: 289 },
    ],
  },
];
