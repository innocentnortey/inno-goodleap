# GoodLeap guided financing — concept prototype

A contractor quoting a $30,000 roof shows the homeowner financing options side by side. The homeowner asks one hard
question about a promo and gets a grounded answer that carries its disclosures. An agent prefills the application
from the contractor's estimate, a failed bank connection gets a recovery path, and the application goes to a mocked
credit engine, which alone decides.

**Buttons handle decisions, AI handles ambiguity and messy documents, code handles every number, disclosure and
decision.** All products, rates, people and services are synthetic. The design doc is in
[`docs/design-doc.md`](docs/design-doc.md) (3-page PDF: [`docs/design-doc.pdf`](docs/design-doc.pdf)).

## Run it (under 5 minutes)

You need Node.js 20 or later (tested on 24) and an Anthropic API key.

```bash
npm install
cp .env.example .env        # then set ANTHROPIC_API_KEY in .env
npm run dev                 # API on http://127.0.0.1:8787, app on http://127.0.0.1:5173
```

Open <http://127.0.0.1:5173>.

### Environment variables

| Variable | Required | What it does |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | The only real credential. Used by the question box, estimate extraction, the application-prep agent and the bank-failure explanation. |
| `LLM_MODEL` | no | Defaults to `claude-sonnet-5-5`. |
| `API_PORT` | no | API port, default `8787`. The web dev server proxies `/api` to it. |
| `WEB_PORT` | no | Web port, default `5173`. |

Plaid, Plaid Document Income, the credit decision engine and the contractor profile service are mocked with canned
JSON in `data/synthetic/`. No other keys are needed.

### Checks

```bash
npm run typecheck           # TypeScript, all workspaces
npm run lint                # ESLint
npm test                    # Vitest: payment maths worked pairs, guardrail checks, agent loop with a fake model
npm run guardrail-check     # Feeds crafted non-compliant outputs to the guardrail; every one must be blocked
npm run smoke               # Playwright: happy path and bank-failure path, screenshots to docs/artifacts/screens/
```

`npm run smoke` expects `npm run dev` to be running and calls the real model.

## Architecture

```
Browser (React 19 + Vite + Tailwind 4)  ──/api──▶  Node + TypeScript (Hono)  ──▶  Anthropic API (claude-sonnet-5-5)
  7 screens                                       ├─ finance/       payment maths, pure functions, unit-tested
                                                  ├─ guardrails/    number check, approval-language check, disclosures
                                                  ├─ assist/        the "Ask about this option" prompt
                                                  ├─ application/   estimate extraction + application-prep agent
                                                  ├─ integrations/  mocked Plaid, document income, credit engine, profiles
                                                  └─ audit/         append-only var/audit.jsonl
```

| Folder | What it holds |
|---|---|
| `apps/web/` | The contractor-portal screens |
| `apps/server/` | The API, the model calls and the guardrails |
| `packages/shared/` | The types both sides use |
| `data/synthetic/` | Every fixture, each marked `"synthetic": true` |
| `scripts/` | The guardrail check and the smoke run |
| `docs/` | The design doc, PRD, worked examples and screenshots |

## Simplifying assumptions

1. The lender is taken to be GoodLeap from the brief's file name only. Products, APRs and promo terms are invented.
2. The homeowner completes income verification and submission on their own step; the contractor never sees income.
3. Plaid Link, Document Income, the credit engine and the contractor profile service return canned responses.
4. The credit engine mock never returns "approved", so no screen can read as an approval.
5. The audit log is a local JSON-lines file; production would use a database (see the design doc).
6. The demo makes no claim about how much of the 22-minute application time it removes; that split is unknown.
7. Payment totals are computed at full precision and rounded once; a lender's cent-rounded schedule can differ by a
   few cents.
8. "Lower monthly payment" ranks each option by its highest scheduled payment, so a 0% intro product is never ranked
   first on its teaser payment. The deferred-interest promo always ranks last because its cost depends on whether the
   balance is cleared in time.
