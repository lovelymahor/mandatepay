// Thin PayPal REST client. Sandbox only. Orders v2 + webhook verification.
import { randomUUID } from "node:crypto";
import { config } from "../config.js";

const { baseUrl, clientId, secret } = config.paypal;
let cached: { token: string; exp: number } | null = null;

async function accessToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 30_000) return cached.token;
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${clientId}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  const data: any = await res.json();
  cached = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return cached.token;
}

async function pp(path: string, init: RequestInit & { requestId?: string } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": init.requestId ?? randomUUID(), // idempotency key
    },
  });
  const body: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`PayPal ${path} failed: ${res.status} ${JSON.stringify(body)}`);
  return body;
}

export async function createOrder(total: number, description: string, requestId: string, currency = "USD") {
  const body = await pp("/v2/checkout/orders", {
    method: "POST",
    requestId,
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{ description, amount: { currency_code: currency, value: total.toFixed(2) } }],
      payment_source: { paypal: { experience_context: { return_url: `${config.appUrl}/?paid=1`, cancel_url: `${config.appUrl}/?cancelled=1` } } },
    }),
  });
  const link = body.links?.find((l: any) => l.rel === "payer-action" || l.rel === "approve");
  return { id: body.id as string, approveUrl: link?.href as string | undefined };
}

export const captureOrder = (id: string) => pp(`/v2/checkout/orders/${id}/capture`, { method: "POST", body: "{}" });

export async function verifyWebhook(headers: Record<string, any>, event: unknown): Promise<boolean> {
  const body = await pp("/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: JSON.stringify({
      auth_algo: headers["paypal-auth-algo"],
      cert_url: headers["paypal-cert-url"],
      transmission_id: headers["paypal-transmission-id"],
      transmission_sig: headers["paypal-transmission-sig"],
      transmission_time: headers["paypal-transmission-time"],
      webhook_id: config.paypal.webhookId,
      webhook_event: event,
    }),
  });
  return body.verification_status === "SUCCESS";
}
