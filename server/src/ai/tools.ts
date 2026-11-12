import type { CartItem } from "../policy/index.js";

// Demo catalog. Replace/augment with Channel3 product search for live data.
const CATALOG: CartItem[] = [
  { name: "Roasted almonds 1kg", price: 18, qty: 1, category: "snacks", seller: "NutHouse" },
  { name: "Veggie chips (12 pack)", price: 14, qty: 1, category: "snacks", seller: "CrunchCo" },
  { name: "Herbal tea box", price: 11, qty: 1, category: "beverages", seller: "LeafLab" },
  { name: "Sparkling water (24)", price: 16, qty: 1, category: "beverages", seller: "AquaPure" },
  { name: "Mystery gadget", price: 120, qty: 1, category: "electronics", seller: "ShadyDeals" },
];

export function searchProducts(query: string): CartItem[] {
  const q = query.toLowerCase();
  const hits = CATALOG.filter((p) => `${p.name} ${p.category}`.toLowerCase().includes(q) || q.split(" ").some((w) => w.length > 3 && p.category.includes(w)));
  return hits.length ? hits : CATALOG;
}

export const toolDefs = [
  { name: "search_products", description: "Search the product catalog by keyword.", input_schema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  {
    name: "propose_order",
    description: "Propose a cart. The policy engine decides whether it is auto-approved, needs human approval, or is blocked.",
    input_schema: {
      type: "object",
      properties: {
        items: { type: "array", items: { type: "object", properties: { name: { type: "string" }, price: { type: "number" }, qty: { type: "number" }, category: { type: "string" }, seller: { type: "string" } }, required: ["name", "price", "qty", "category", "seller"] } },
        explanation: { type: "string", description: "Why these items were chosen." },
      },
      required: ["items", "explanation"],
    },
  },
];
