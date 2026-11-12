// Deterministic spending rules. The AI proposes; this code decides. No AI in this file.
import { z } from "zod";

export const MandateSchema = z.object({
  budgetTotal: z.number().positive(),
  perItemMax: z.number().positive(),
  allowedCategories: z.array(z.string()).default([]), // empty = any category
  blockedSellers: z.array(z.string()).default([]),
  autoApproveBelow: z.number().nonnegative(),
  spent: z.number().nonnegative().default(0),
  expiresAt: z.string().optional(),
});
export type Mandate = z.infer<typeof MandateSchema>;

export interface CartItem { name: string; price: number; qty: number; category: string; seller: string }
export type Decision = "AUTO" | "NEEDS_APPROVAL" | "BLOCKED";

export function evaluateCart(m: Mandate, items: CartItem[], now = new Date()): { decision: Decision; reasons: string[]; total: number } {
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const blocked: string[] = [];
  if (m.expiresAt && new Date(m.expiresAt) < now) blocked.push("Mandate has expired.");
  if (items.length === 0) blocked.push("Cart is empty.");
  for (const i of items) {
    if (i.price > m.perItemMax) blocked.push(`${i.name} exceeds the per-item limit of $${m.perItemMax}.`);
    if (m.blockedSellers.map((s) => s.toLowerCase()).includes(i.seller.toLowerCase())) blocked.push(`Seller "${i.seller}" is blocked.`);
    if (m.allowedCategories.length && !m.allowedCategories.map((c) => c.toLowerCase()).includes(i.category.toLowerCase()))
      blocked.push(`Category "${i.category}" is not allowed.`);
  }
  if (m.spent + total > m.budgetTotal) blocked.push(`Total would exceed the remaining budget of $${(m.budgetTotal - m.spent).toFixed(2)}.`);
  if (blocked.length) return { decision: "BLOCKED", reasons: blocked, total };
  if (total >= m.autoApproveBelow) return { decision: "NEEDS_APPROVAL", reasons: [`Total $${total.toFixed(2)} is at or above the auto-approve limit of $${m.autoApproveBelow}.`], total };
  return { decision: "AUTO", reasons: ["Within mandate and under the auto-approve limit."], total };
}
