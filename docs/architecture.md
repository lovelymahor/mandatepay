# Architecture

```mermaid
flowchart LR
  U[User] --> W[React web app]
  W --> S[Express server]
  S --> AI[Claude: parse mandate, agent loop]
  AI -->|tool calls| S
  S --> P[Policy gate: deterministic rules]
  P -->|AUTO or approved| PP[PayPal sandbox Orders v2]
  PP -->|webhook| S
  S --> DB[(JSON store)]
  DB --> W
```

Principle: **the AI suggests, deterministic code enforces.** `server/src/policy` contains no AI calls.

Flow: mandate text -> validated JSON -> agent searches and proposes a cart -> policy returns AUTO / NEEDS_APPROVAL / BLOCKED -> PayPal order created -> buyer approves in sandbox -> capture -> webhook confirms -> audit log updates.
