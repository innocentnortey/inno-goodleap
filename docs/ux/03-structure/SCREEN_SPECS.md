# Screen specs (UX-3b, light mode: core screens)

Theme: Riverside direction B rebranded GoodLeap (D-6): Manrope; lilac-to-periwinkle grain backdrop; one white window;
**left** step rail (7 steps, state in words, a "Hand to homeowner" divider before step 4); **centre** the task;
**right** the running summary ("Financing summary": amount, chosen option, monthly, total; then application
readiness) with the screen's one primary action at its foot. Top bar: GoodLeap wordmark + "Concept prototype ·
synthetic data" tag + links to Audit and Next. Light theme default; dark exists. Tokens: copy Riverside's
`design.md` table; accent stays `#4F4FCF`. Every `$`/`%` figure uses tabular figures. Disclosures use one
`<Disclosure>` component: small, muted, never hidden behind a tooltip.

## SCR-1 · Compare options

- **Centre:** amount field with quick chips ($15K · $30K · $45K); priority segmented control (*Lower monthly payment* / *Lower total cost*); then **three product cards** in a row (top 3 by priority; "Show all 6" expands to a 2×3 grid).
- **Card:** product name · monthly payment (large) · "for N months" · APR · total paid · total interest · promo condition line in the `--check` warning colour when one exists ("Only cheaper if paid off within 18 months") · `<Disclosure>` · two buttons: **Ask about this option** (secondary) · **Choose this option** (primary when selected).
- **Right:** summary fills as the amount and option are chosen; primary action **Start application** (disabled until an option is chosen).
- **States:** empty, loading (skeleton cards), results, out-of-range error inline under the amount, server error toast with retry.
- **Copy rule:** never "your rate" or "you'll pay"; always "estimated payment".

## SCR-2 · Ask about this option (slide-over panel on SCR-1)

- **Header:** "About the {product name}" + the product's key numbers as chips (the allowed numbers, visibly).
- **Body:** three suggested questions as chips; a single-line input; answers as a short card: answer text → `<Disclosure>` block → "See full terms" link (opens the terms text) → a tiny "checked ✓ numbers · ✓ wording · ✓ disclosures" row that links to the audit record.
- **States:** idle · thinking (elapsed timer, target ≤ 5 s) · answered · redirected (same card, neutral tone, no disclosures needed but still shown) · safe template (card with a small "fallback" tag) · error.
- **Never:** free-form chat history across products; a "send" affordance that looks like a messaging app. It is a question box, not a chatbot.

## SCR-3 · Start application

- **Centre:** estimate picker (three sample files as cards + an upload drop zone) → **Prepare application** button → an "Agent steps" strip (collapsed by default, expands to the ≤ 6 steps with tool names) → **Prefilled fields** table: field · value · source chip (`estimate` / `profile` / `conversation`) · confidence bar · status pill (`ready` · `needs review` · `needs input` · `needs authorization`) · edit control.
- **Right:** "What the homeowner still needs to do" checklist; primary action **Hand to homeowner**.
- **States:** no estimate · extracting · prepared · partial · error.
- **Rule:** a `needs input` row shows a blank value and the reason ("no total on the estimate"), never a guess.

## SCR-4 · Verify income (homeowner step)

- **Centre:** a calm card: "Verify your income securely" · what will and won't be shared (the contractor doesn't see this) · **Connect bank** button that opens a synthetic Plaid Link sheet with two demo buttons (*succeeds* / *fails*) · below, the **outcome panel**.
- **Failure panel:** status line (template, includes "nothing was submitted and no decision was made") · guarded explanation card (same component as SCR-2 answers, no numbers) · actions **Try again** and **Upload a pay stub instead**.
- **Document path:** mocked upload → extracted income rows with source `document`, status `needs review`, annualised figure marked "computed".
- **Right:** application readiness; primary action **Continue to review** (enabled once income is `ready` or `needs review`).

## SCR-5 · Review and submit (homeowner)

- **Centre:** grouped fields (Project · Financing · Contractor · About you · Income) each with value, source chip, edit; incomplete rows listed at the top with jump links; consents (three checkboxes incl. disclosures acknowledgement) · `<Disclosure>` full block · **Submit application**.
- **Result card:** "Sent to the lender's credit review" · decision `pending` / `conditional` with next steps · reference id · "This result comes from the credit decision engine, not from this assistant." · links to Audit and Next.
- **States:** reviewing · incomplete · submitting · submitted · error.

## SCR-6 · Compliance audit

- **Centre:** table of records (time · screen · purpose · product · outcome · latency) → detail drawer: inputs (question/event, allowed numbers, disclosures) · raw model output · checks with pass/fail and detail · final text · model/prompt/catalog versions.
- **Right:** counts by outcome (shown / regenerated / safe template) for this session.

## SCR-7 · Where we'd take it next

- Sections, in order: **Where it started** (verified baseline, each line with its source) · **What this demo changes** (friction point → screen) · **Next 2 weeks / Next quarter / Later** cards, each item: friction point · metric · why it waited · **Assumptions we made** · **What we deliberately didn't build**.
- Static content from `data/synthetic/roadmap.json`; no invented numbers.

## Phone layout (one screen, light-mode requirement)

SCR-1 at 390px: the rail collapses to a top stepper; cards stack; the right summary becomes a sticky bottom bar with the chosen option and the primary action.
