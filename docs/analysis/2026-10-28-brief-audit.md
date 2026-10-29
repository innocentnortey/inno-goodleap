# Brief audit — GoodLeap "Home Improvement Loan Assignment"

**Status: DRAFT for Innocent's sign-off (Stage 1).** Claude, 2026-10-28.
- **Sources:** `docs/source/01-goodleap-brief.md` (ISSUED); `03-` and `04-chatgpt-…` (CONTEXT, Innocent's own analysis with ChatGPT).
- **Rules:** `problem-framing`, `business-metrics`, `brief-conformance`.
- **Labels:** **[B]** stated in the brief · **[C]** from the ChatGPT conversation · **[A]** our assumption · **[H]** historical claim, unverified until checked.

## The problem behind this brief

- **The partner's stated ask [B]:** "design and prototype an AI-powered solution" for contractors who are
  "frustrated with the speed and complexity of the loan application process."
- **The problem we think it answers:** a **sales-conversion problem disguised as a loan-application problem** [C].
  The financing conversation happens at the moment the homeowner is deciding whether to buy. When it stalls, the
  contractor loses the job and the lender loses the loan. The VP prices it this way: "close 10% more deals …
  worth $200M in annual origination volume" [B]. That is lending volume, not revenue [C].
- **The customer it serves:** two people in the same kitchen:
  - the **contractor**, who needs to close ("tell them in 30 seconds what their monthly payment would look like") [B];
  - the **homeowner**, who needs to feel safe committing, because they are "often confused by promotional terms" [B].
- **Evidence [B]:**
  - 22-minute application against a sub-10-minute benchmark;
  - 38% abandonment, "biggest drop-offs … at the income verification and loan product selection steps";
  - manual extraction of pay stubs, estimates and scope letters by staff.

## What the brief establishes about today, and what it doesn't

| Stage | The brief says | We infer | Label |
|---|---|---|---|
| Quote on site | Contractors can't explain products or payments quickly | A calculator alone hasn't fixed this (one existed in 2023 [H]) | B / H |
| Product selection | One of the two biggest drop-offs; promo terms confuse homeowners | The problem is understanding, not arithmetic | B |
| Application entry | 22 minutes on average | How the 22 minutes split (typing, waiting, fixing) is **unknown** | B / A |
| Income verification | Plaid API exists, yet this is a top drop-off point | Plaid is present but doesn't recover every applicant (failed links, declined consent, thin data) | B / C |
| Documents | Staff extract details from uploads by hand | Estimates and scope letters fall outside Plaid's income products, a confirmed automation gap | B / C |
| Credit decision | An engine exists; "no AI system can make or imply a credit decision" | Keep the decision where it is | B |

## Assumptions inside the requirements

| Assumption | Mark |
|---|---|
| An AI solution is the right tool for every friction point | **question it.** The quote is arithmetic; buttons win there (Innocent, 2026-10-28) |
| The fix is a chatbot | **question it.** The brief grades "conversational UX", but chat suits ambiguity only [C] |
| Plaid is broken | **question it.** It exists; the failure may be consent, connectivity or recovery [C] |
| Document extraction alone will cut 22 minutes to under 10 | **question it.** The brief doesn't split the 22 minutes [C] |
| Every borrower-facing message needs TILA/RESPA disclosures and an audit trail | **needed** (hard constraint) |
| Financial services can be mocked; a real LLM is required | **needed** (brief's ground rules) |
| The company is GoodLeap | **probably needed.** Inferred from the file name only |

## Complaint → observed → underneath

| Complaint [B] | What we observe | What we think is underneath |
|---|---|---|
| "I need to be able to tell them in 30 seconds what their monthly payment would look like" | The maths is instant; explaining a promo is not | Homeowners don't understand *what they're agreeing to* (deferred interest, term vs total cost) |
| 38% abandon at product selection | A comparison of 3+ products with promos | The homeowner can't weigh tradeoffs against what they care about |
| 38% abandon at income verification | Plaid exists | When the bank link fails, nobody explains what to do next, and the homeowner leaves |
| Staff key in documents by hand | Estimates differ across 15,000 contractors | Unstructured documents can't go through a fixed form |

## Why-chain

**Scope:**
- **Unit:** the contractor-assisted financing journey (product: partner portal; company: the lender).
- **Customer:** the homeowner deciding in the kitchen, helped by the contractor.

1. Why does the lender lose originations? Applications are abandoned (38%) [B].
2. Why are they abandoned? Mostly at product selection and income verification [B].
3. Why at product selection? Homeowners don't understand promo terms, and contractors can't explain them [B].
4. Why at income verification? When verification hits a snag, the journey has no clear recovery [A, plausible per C].
5. **Cause we can change, measure and explain in one sentence:** *at the two drop-off points, the homeowner hits
   something they don't understand and nothing helps them through it.*

**Rejected branch:** "applications are slow because people type too much." The brief never splits the 22
minutes [C], so promising a cut to under 10 minutes from extraction alone would be a guess. Extraction stays in, as
a supporting feature where manual work is confirmed (estimates).

## Metrics (two groups)

**North star: the application completion rate among applications started in contractor-assisted sessions.**
- **Unit:** completed applications ÷ applications started, per week, by contractor segment and loan product.
- **Hop chain to money:** more completed applications → more credit decisions → more originations. That last
  hop is the VP's figure: 10% more deals ≈ $200M of volume [B].
- **Baseline:** 62% completion (100% − 38%) [B].
- **Aspiration:** a meaningful lift in a contractor pilot. The size is a target, not a measurement [A].
- **Hard gate:** zero compliance failures shown to borrowers.
- **Guard against gaming:** watch decline and cancellation rates, so the system isn't pushing unqualified
  homeowners into applications.

| Group | Metric | Leading / lagging | Decision line |
|---|---|---|---|
| Value | Drop-off rate at product selection (per started application) | lagging | If it doesn't fall in the pilot, the question box isn't the fix: look at the comparison layout |
| Value | Recovery rate after a failed Plaid link (completed ÷ failed links) | lagging | If under baseline, revisit the recovery path |
| Value | Time from "start application" to submit, in minutes; baseline 22 [B] | lagging | Report the split by step before claiming a cut |
| Value | Share of prefilled fields the homeowner keeps unchanged | leading | If corrections are high, extraction quality is the bottleneck |
| Value | Questions asked per session, paired with the share answered without a fallback | leading | Paired: engagement only counts with answer quality |
| Health | Guardrail blocks per 100 borrower messages, broken down by reason | leading | A spike means prompt or catalog drift: review the audit log |
| Health | Answer latency p95 (target ≤ 5 s on site [A]) | leading | Over target: shorter context or a faster model |
| Health | Extraction errors caught by validation | leading | Rising: review the document types |

**Review line:** weekly during a pilot.

**Best objection and answer:**
- *Objection:* "Completion can rise while bad loans rise too."
- *Answer:* the credit engine still decides; we report decline rates alongside completion; and the AI never implies
  approval.

## Partner beliefs we label, not assert

- **GoodLeap's 2023 QuickLink flow** (up to 3 products, estimated payments, a digital application) [H]. It must be
  verified before the roadmap page cites it.
- **Plaid Document Income** handles pay stubs [C]. Whether the lender licenses it is unknown [A]. The demo mocks it.
- **The homeowner might take over on their own device.** The handoff point isn't in the brief [C]. The demo assumes
  the homeowner completes the sensitive steps themselves [A].

## Write-up opening (GP-130)

*The brief asked for an AI loan assistant. We found that the money is lost at two moments of confusion: choosing a
product and getting through income verification. We built a guided financing journey: buttons for decisions, AI
only where the homeowner is confused or a document is messy, and code for every number and decision. Completion
should rise because each drop-off point now has a way through. We deliberately did not build another calculator,
a chatbot that runs the application, or a second income-verification system.*
