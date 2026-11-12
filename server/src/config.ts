import "dotenv/config";
export const config = {
  port: Number(process.env.PORT ?? 3001),
  appUrl: process.env.APP_URL ?? "http://localhost:5173",
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID ?? "",
    secret: process.env.PAYPAL_CLIENT_SECRET ?? "",
    webhookId: process.env.PAYPAL_WEBHOOK_ID ?? "",
    baseUrl: process.env.PAYPAL_BASE_URL ?? "https://api-m.sandbox.paypal.com",
  },
  ai: { key: process.env.ANTHROPIC_API_KEY ?? "", model: process.env.AI_MODEL ?? "claude-sonnet-5-5" },
};
