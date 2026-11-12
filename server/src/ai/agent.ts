import { config } from "../config.js";
import { AGENT_PROMPT, MANDATE_PROMPT } from "./prompts.js";
import { toolDefs, searchProducts } from "./tools.js";
import { MandateSchema } from "./schemas.js";
import { proposeOrder } from "../services/orders.js";

async function callClaude(body: object) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": config.ai.key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: config.ai.model, max_tokens: 1000, ...body }),
  });
  if (!res.ok) throw new Error(`AI call failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as any;
}

/** Natural-language rule -> validated Mandate. Retries once with the validation error. */
export async function parseMandate(text: string) {
  let feedback = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const out = await callClaude({ system: MANDATE_PROMPT, messages: [{ role: "user", content: text + feedback }] });
    const raw = out.content.map((c: any) => c.text ?? "").join("").replace(/```json|```/g, "").trim();
    try { return MandateSchema.parse(JSON.parse(raw)); }
    catch (e) { feedback = `\n\nYour last answer was invalid (${(e as Error).message}). Return only valid JSON.`; }
  }
  throw new Error("Could not parse a valid mandate");
}

/** Agent loop with a hard step limit. Returns the agent's final message and any orders it proposed. */
export async function runAgent(mandateId: string, request: string, maxSteps = 8) {
  const messages: any[] = [{ role: "user", content: request }];
  const orders: unknown[] = [];
  const steps: string[] = [];
  for (let step = 0; step < maxSteps; step++) {
    const out = await callClaude({ system: AGENT_PROMPT, tools: toolDefs, messages });
    messages.push({ role: "assistant", content: out.content });
    const calls = out.content.filter((c: any) => c.type === "tool_use");
    if (!calls.length) return { reply: out.content.map((c: any) => c.text ?? "").join(""), orders, steps };
    const results: any[] = [];
    for (const call of calls) {
      steps.push(`${call.name}(${JSON.stringify(call.input).slice(0, 80)})`);
      let result: unknown;
      try {
        if (call.name === "search_products") result = searchProducts(call.input.query);
        else if (call.name === "propose_order") { const o = await proposeOrder(mandateId, call.input.items, call.input.explanation); orders.push(o); result = { status: o.status, decision: o.decision, reasons: o.reasons, total: o.total }; }
        else result = { error: "unknown tool" };
      } catch (e) { result = { error: (e as Error).message }; }
      results.push({ type: "tool_result", tool_use_id: call.id, content: JSON.stringify(result) });
    }
    messages.push({ role: "user", content: results });
  }
  return { reply: "Stopped: step limit reached.", orders, steps };
}
