// Seeds demo data so judges see a populated dashboard. Run: npm run seed
import fs from "node:fs";
import path from "node:path";
const file = path.resolve(process.cwd(), "data/db.json");
fs.mkdirSync(path.dirname(file), { recursive: true });
const id = "demo-mandate";
fs.writeFileSync(file, JSON.stringify({
  mandates: { [id]: { id, text: "Office snacks, max $80, no unknown sellers", budgetTotal: 80, perItemMax: 25, allowedCategories: ["snacks", "beverages"], blockedSellers: ["ShadyDeals"], autoApproveBelow: 20, spent: 0 } },
  orders: [],
}, null, 2));
console.log("Seeded demo mandate:", id);
