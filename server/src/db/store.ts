// Tiny JSON-file store so judges need no database setup. Swap for Postgres later.
import fs from "node:fs";
import path from "node:path";
import type { Mandate, CartItem, Decision } from "../policy/index.js";

export type Status = "BLOCKED" | "NEEDS_APPROVAL" | "AWAITING_BUYER" | "PAID" | "REJECTED";
export interface Order {
  id: string; mandateId: string; items: CartItem[]; total: number; decision: Decision; status: Status;
  reasons: string[]; explanation: string; paypalOrderId?: string; approveUrl?: string; createdAt: string;
}
interface DB { mandates: Record<string, Mandate & { id: string; text: string }>; orders: Order[] }

const FILE = path.resolve(process.cwd(), "data/db.json");
function load(): DB {
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return { mandates: {}, orders: [] }; }
}
function save(db: DB) { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(db, null, 2)); }

export const store = {
  mutate<T>(fn: (db: DB) => T): T { const db = load(); const out = fn(db); save(db); return out; },
  read<T>(fn: (db: DB) => T): T { return fn(load()); },
};
