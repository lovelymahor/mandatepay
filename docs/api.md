# API

| Method | Path | Purpose |
|---|---|---|
| POST | /api/mandates | `{text}` -> parsed, stored mandate |
| GET | /api/mandates | List mandates |
| POST | /api/tasks | `{mandateId, request}` -> run agent |
| GET | /api/orders | Audit log |
| POST | /api/orders/:id/approve | Human approves; creates PayPal sandbox order |
| POST | /api/orders/:id/reject | Human rejects |
| POST | /api/orders/:id/capture | Capture after buyer approves on PayPal |
| POST | /api/webhooks/paypal | PayPal webhook (signature verified) |

## Webhooks locally
1. Run a tunnel (`ngrok http 3001`).
2. In the PayPal Developer Dashboard add webhook `https://<tunnel>/api/webhooks/paypal` for `PAYMENT.CAPTURE.COMPLETED`.
3. Put the Webhook ID in `.env` as `PAYPAL_WEBHOOK_ID`.
