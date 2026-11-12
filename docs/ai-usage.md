# AI usage

| Where | Model/tool | Purpose |
|---|---|---|
| `server/src/ai/agent.ts` parseMandate | Claude (Messages API) | Natural language to structured mandate JSON, validated with Zod, one retry on invalid output |
| `server/src/ai/agent.ts` runAgent | Claude with tool use | Agent loop (max 8 steps): search products, propose cart, explain choices |

Safety: the model cannot move money. All limits live in `server/src/policy`, are unit-tested, and run after every proposal.
