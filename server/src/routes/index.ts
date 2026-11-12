import { Router } from "express";
import { randomUUID } from "node:crypto";
import { store } from "../db/store.js";
import { parseMandate, runAgent } from "../ai/agent.js";
import { approveOrder, rejectOrder, markPaid } from "../services/orders.js";
import { captureOrder, verifyWebhook } from "../paypal/client.js";

export const api = Router();
const wrap = (fn: any) => (req: any, res: any) => fn(req, res).catch((e: Error) => res.status(400).json({ error: e.message }));

api.post("/mandates", wrap(async (req: any, res: any) => {
  const mandate = await parseMandate(String(req.body.text ?? ""));
  const id = randomUUID();
  store.mutate((db) => { db.mandates[id] = { ...mandate, id, text: req.body.text }; });
  res.json({ id, ...mandate });
}));

api.get("/mandates", (_req, res) => res.json(store.read((db) => Object.values(db.mandates))));
api.get("/orders", (_req, res) => res.json(store.read((db) => db.orders)));

api.post("/tasks", wrap(async (req: any, res: any) => res.json(await runAgent(req.body.mandateId, String(req.body.request)))));
api.post("/orders/:id/approve", wrap(async (req: any, res: any) => res.json(await approveOrder(req.params.id))));
api.post("/orders/:id/reject", wrap(async (req: any, res: any) => res.json(rejectOrder(req.params.id))));

// After the buyer approves on PayPal, capture the money (sandbox).
api.post("/orders/:id/capture", wrap(async (req: any, res: any) => {
  const o = store.read((db) => db.orders.find((x) => x.id === req.params.id));
  if (!o?.paypalOrderId) throw new Error("No PayPal order");
  const result = await captureOrder(o.paypalOrderId);
  if (result.status === "COMPLETED") markPaid(o.paypalOrderId);
  res.json(result);
}));

// Webhooks: signature is verified with PayPal before we trust the event.
api.post("/webhooks/paypal", wrap(async (req: any, res: any) => {
  if (!(await verifyWebhook(req.headers, req.body))) return res.status(400).json({ error: "bad signature" });
  if (req.body.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const ppId = req.body.resource?.supplementary_data?.related_ids?.order_id;
    if (ppId) markPaid(ppId);
  }
  res.json({ ok: true });
}));
