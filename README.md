# MandatePay

**Give your AI agent a spending mandate, not your wallet.** It shops inside rules you set, asks a human when unsure, pays through the PayPal sandbox, and explains every decision.

Built for the PayPal AI Hackathon (Devpost, 2026).

- Demo: _add hosted URL_
- Video: _add YouTube link_

## Problem
People and small businesses want to delegate purchasing to AI but fear runaway spending.

## Solution
1. Write a rule in plain English; AI turns it into a validated **mandate** (budget, per-item limit, categories, blocked sellers, auto-approve threshold).
2. An **agent** (Claude tool use) searches products and proposes a cart.
3. A deterministic **policy gate** returns `AUTO`, `NEEDS_APPROVAL` or `BLOCKED`.
4. Approved carts become **PayPal sandbox orders**; the buyer approves, the server captures, and a **verified webhook** confirms.
5. Every decision lands in an **AG Grid audit log** with an AI explanation.

## How PayPal is used
Orders v2 (create, capture) with idempotency keys, OAuth2 client credentials, and webhook signature verification. Sandbox only.

## How AI is used
Claude Messages API: structured output (mandate parsing, Zod-validated with retry) and a tool-use agent loop with a step limit. See `docs/ai-usage.md`.

## Sponsor tools
AG Grid (audit log). Optional: Render (hosting), Channel3 (swap the demo catalog in `server/src/ai/tools.ts`), Postman (`postman/`).

## Setup
Prerequisites: Node.js 20+, a PayPal Developer sandbox app, an Anthropic API key.

```bash
git clone <your-repo-url> && cd mandatepay
cp .env.example .env      # fill in PayPal + AI keys
npm install
npm run seed              # optional demo mandate
npm run dev               # web: http://localhost:5173, server: http://localhost:3001
npm test                  # policy unit tests
```

To complete a payment: run the agent, click the PayPal sandbox link, log in with your sandbox **Personal** test account, approve, then click "capture".

## Repository layout
See `docs/architecture.md`. Key folders: `server/src/policy` (rules), `server/src/ai` (agent), `server/src/paypal` (client), `web/src/pages` (UI).

## Built during the hackathon
Everything in this repository.

## Limitations and next steps
JSON file store (use Postgres on Render for production), demo product catalog, single user, sandbox only.

## License
MIT
