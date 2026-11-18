import fs from "fs";
import path from "path";
import type { Database } from "../agent/types";
import { seedOrders, seedProducts, seedUsers } from "./seed";

/** 落盘位置：server/data/db.json */
const DATA_DIR = path.resolve(__dirname, "..", "..", "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

let cache: Database | null = null;

function writeSeed(): Database {
  const db: Database = { products: seedProducts, orders: seedOrders, users: seedUsers };
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  return db;
}

/** 加载数据库：优先读取落盘文件，不存在则用种子数据初始化 */
export function loadDb(): Database {
  if (cache) return cache;
  if (fs.existsSync(DB_PATH)) {
    try {
      cache = JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as Database;
      return cache;
    } catch {
      // 文件损坏时回退到种子数据
    }
  }
  cache = writeSeed();
  return cache;
}

export function getDb(): Database {
  return loadDb();
}
