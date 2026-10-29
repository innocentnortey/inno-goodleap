# Data reality (Stage 2, light mode)

The brief ships no data, so every sample here is **synthetic and labelled**. The point of the stage still holds:
look at a real-shaped input next to the required output before judging how hard each step is.

## Selection matrix

| Source the product reads | Samples | Why these | Strange one |
|---|---|---|---|
| Loan product catalog | `samples/catalog.json` (6 products) | One of each promo mechanic the brief names: fixed APRs across terms, a 0% intro period, deferred interest | `GL-DEF-18`: looks cheapest, costs most if missed |
| Contractor estimates | `samples/estimates/roof_clean.txt`, `roof_messy.txt`, `hvac_missing_total.txt` | Clean (tests the happy path), messy (abbreviations, line items, a deposit: tests extraction), missing total (tests "never guess") | `hvac_missing_total.txt` has no total at all |
| Contractor profile service | `samples/contractors.json` | Two profiles so the agent must pick the right one | — |
| Income verification (Plaid) | `samples/plaid.json` | Success, connection failure, insufficient data | `connection_failed` is the friction case |
| Document income (pay stub) | `samples/paystub.json` | The document path after a Plaid failure | Bi-weekly pay must be annualised by code |
| Credit decision engine | `samples/credit-engine.json` | `pending`, `conditional` | Neither is a yes: the demo never shows "approved" |
| Homeowner questions | in `worked-pairs.md` WP-2 | One in-scope promo question, one eligibility question, one off-topic | "Will I qualify?" must be redirected, never answered |

Segment F copies these into `data/synthetic/` for the app; this folder is the record.

## Worked pairs

`worked-pairs.md`: WP-1 quote maths · WP-2 guarded answer · WP-3 estimate extraction · WP-4 Plaid-failure recovery.
Each is marked easy/hard and sure/uncertain, and each becomes a test or a scripted check in the build.
