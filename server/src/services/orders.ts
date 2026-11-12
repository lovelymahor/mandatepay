import { randomUUID } from "node:crypto";
import { evaluateCart, type CartItem } from "../policy/index.js";
import { store, type Order } from "../db/store.js";
import { createOrder } from "../paypal/client.js";

export async function proposeOrder(mandateId: string, items: CartItem[], explanation: string): Promise<Order> {
  const mandate = store.read((db) => db.mandates[mandateId]);
  if (!mandate) throw new Error("Mandate not found");
  const { decision, reasons, total } = evaluateCart(mandate, items);
  const order: Order = {
    id: randomUUID(), mandateId, items, total, decision, reasons, explanation,
    status: decision === "BLOCKED" ? "BLOCKED" : decision === "AUTO" ? "AWAITING_BUYER" : "NEEDS_APPROVAL",
    createdAt: new Date().toISOString(),
  };
  if (decision === "AUTO") await attachPayPalOrder(order); // auto-approved inside mandate
  store.mutate((db) => { db.orders.unshift(order); });
  return order;
}

async function attachPayPalOrder(order: Order) {
  const pp = await createOrder(order.total, order.items.map((i) => i.name).join(", ").slice(0, 120), order.id);
  order.paypalOrderId = pp.id;
  order.approveUrl = pp.approveUrl;
  order.status = "AWAITING_BUYER";
}

export async function approveOrder(id: string) {
  const order = store.read((db) => db.orders.find((o) => o.id === id));
  if (!order || order.status !== "NEEDS_APPROVAL") throw new Error("Order is not awaiting approval");
  await attachPayPalOrder(order);
  store.mutate((db) => { db.orders[db.orders.findIndex((o) => o.id === id)] = order; });
  return order;
}

export function rejectOrder(id: string) {
  return store.mutate((db) => { const o = db.orders.find((x) => x.id === id)!; o.status = "REJECTED"; return o; });
}

export function markPaid(paypalOrderId: string) {
  store.mutate((db) => {
    const o = db.orders.find((x) => x.paypalOrderId === paypalOrderId);
    if (o && o.status !== "PAID") { o.status = "PAID"; const m = db.mandates[o.mandateId]; if (m) m.spent += o.total; }
  });
}
