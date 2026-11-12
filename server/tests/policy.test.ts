import { describe, it, expect } from "vitest";
import { evaluateCart, type Mandate } from "../src/policy/index.js";

const m: Mandate = { budgetTotal: 100, perItemMax: 40, allowedCategories: ["snacks"], blockedSellers: ["ShadyDeals"], autoApproveBelow: 30, spent: 0 };
const snack = (price: number, seller = "NutHouse", category = "snacks") => ({ name: "x", price, qty: 1, category, seller });

describe("policy gate", () => {
  it("auto-approves small in-mandate carts", () => expect(evaluateCart(m, [snack(10)]).decision).toBe("AUTO"));
  it("asks a human above the auto limit", () => expect(evaluateCart(m, [snack(35)]).decision).toBe("NEEDS_APPROVAL"));
  it("blocks over per-item max", () => expect(evaluateCart(m, [snack(50)]).decision).toBe("BLOCKED"));
  it("blocks blocked sellers", () => expect(evaluateCart(m, [snack(5, "ShadyDeals")]).decision).toBe("BLOCKED"));
  it("blocks disallowed categories", () => expect(evaluateCart(m, [snack(5, "NutHouse", "electronics")]).decision).toBe("BLOCKED"));
  it("blocks over total budget", () => expect(evaluateCart({ ...m, spent: 95 }, [snack(10)]).decision).toBe("BLOCKED"));
  it("blocks expired mandates", () => expect(evaluateCart({ ...m, expiresAt: "2020-01-01" }, [snack(5)]).decision).toBe("BLOCKED"));
});
