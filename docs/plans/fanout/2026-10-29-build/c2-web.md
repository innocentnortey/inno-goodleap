# C2 · Web: SCR-3 Start application, SCR-4 Verify income, SCR-5 Review and submit

Planner: fanout-planner (Opus 5.5), 2026-10-29. Direct planning. Implementer: `fanout-implementer` (Sonnet).
Index and the contract shared with c1: [`c.md`](c.md) — **read its *Shared contract* first; the route table, field
keys, labels and status lines there are exact.** c1 builds the routes in parallel; build against the contract and use
the live server once c1's routes answer (they return 501 until then).

## 1. Goal and sources

Replace the three screen stubs with the working SCR-3, SCR-4 and SCR-5, sharing small sub-components under
`apps/web/src/screens/application/`.

Sources: `docs/ux/03-structure/SCREEN_SPECS.md` SCR-3, SCR-4, SCR-5; `docs/ux/01-planning/USER_FLOWS.md` flows A and B,
*States per screen*, *Permissions* ("Income values (Plaid / document): Contractor screens (1–3) **no** (R-12)";
"Homeowner identity fields: entered by homeowner only"); `docs/prd/goodleap-prd.md` R-8 (steps visible, collapsed),
R-9, R-10, R-11, R-12, R-13, R-14; `.claude/rules/brief-conformance.md` §1–§2; `docs/data/worked-pairs.md` WP-4.

## 2. Boundary

**Modify (replace stubs; keep the default export):** `apps/web/src/screens/StartApplication.tsx` (SCR-3, route `apply`),
`apps/web/src/screens/VerifyIncome.tsx` (SCR-4, `verify`), `apps/web/src/screens/Review.tsx` (SCR-5, `review`).

**Create:** `apps/web/src/screens/application/format.ts`, `FieldsTable.tsx`, `AgentSteps.tsx`, `ExplanationCard.tsx`,
`PlaidSheet.tsx`, `IdentityForm.tsx`. Scratch (not committed, not linted): `var/c2-screens.mjs`.

**Read only, never edit:** `apps/web/src/components/ui.tsx`, `Disclosure.tsx`, `Summary.tsx`, `Shell.tsx`,
`AskAboutOption.tsx`, `state/session.ts`, `lib/api.ts`, `router.ts`, `screens/registry.ts`, `App.tsx`, `index.css`,
`packages/shared/**`, all of `apps/server/**`.

**Do not:** start Vite or the API (both run: 5173 and 8787, hot reload); add dependencies; add a phone action bar
(`TaskLayout` turns `action` into a fixed bottom bar below `lg`); write identity values to `sessionStorage`,
`localStorage` or the console; render any income value on SCR-3; commit.

## 3. Requirements table

| # | Requirement (source) | Implementation | Verification |
|---|---|---|---|
| 1 | SCR-3 centre: estimate picker (3 cards + upload) → **Prepare application** → collapsed "Agent steps" (≤ 6, tool names) → prefilled table: field · value · source chip · confidence bar · status pill · edit | `StartApplication.tsx`, `AgentSteps`, `FieldsTable` | click path A below; `scr-3-apply.png` |
| 2 | SCR-3 right: checklist "What the homeowner still needs to do"; primary **Hand to homeowner** | `TaskLayout` `right` + `action` | click path A |
| 3 | SCR-3 states: no estimate · extracting · prepared · partial · error (+ no option chosen → link to Compare) | state machine in Step 4 | click path A, E |
| 4 | SCR-3 rule: a `needs input` row shows a blank value and the reason, never a guess | `FieldsTable` value cell | hvac estimate shows "—" + note |
| 5 | R-12: income values never on SCR-3 | `FieldsTable` `mode="contractor"` renders income rows as "Homeowner will connect" regardless of value | after SCR-4 success, go back to SCR-3: no "$68,900.00" |
| 6 | SCR-4: calm card, what is/isn't shared, **Connect bank** → synthetic Plaid sheet (succeeds / fails / not enough history) | `VerifyIncome.tsx`, `PlaidSheet` (`<dialog>`) | click path B |
| 7 | SCR-4 failure panel: template status line ("nothing was submitted and no decision was made") · guarded explanation card + disclosure · **Try again** · **Upload a pay stub instead** | `ExplanationCard`, panel in Step 6 | `scr-4-verify-failed.png` |
| 8 | SCR-4 document path: income rows source `document`, `needs review`, annualised marked computed | income `FieldsTable` | click path B |
| 9 | SCR-4 right: readiness; **Continue to review** enabled once income is ready or needs review | `TaskLayout` | click path B |
| 10 | SCR-5: groups Project · Financing · Contractor · About you · Income, source chip, edit; incomplete rows at top with jump links | `Review.tsx`, `FieldsTable mode="homeowner"`, `IdentityForm` | click path C |
| 11 | R-13: editing changes source to `homeowner`; consents (3) and disclosures before submit | edit handler; consent checkboxes; `Disclosure full` | click path C |
| 12 | SCR-5 result card: "Sent to the lender's credit review" · decision + next steps · reference id · "This result comes from the credit decision engine, not from this assistant." · links to Audit and Next | result card | `scr-5-review.png` |
| 13 | SCR-5 states: reviewing · incomplete · submitting · submitted · error | Step 7 | click path C, D |
| 14 | Identity entered by the homeowner only, never stored by the browser | `IdentityForm` keeps values in React state only | DevTools-free check: `sessionStorage` JSON after typing contains no typed name (script step) |

## 4. Shared code to use (copied from current code)

```ts
// apps/web/src/components/ui.tsx
export const cx: (...c: (string | false | null | undefined)[]) => string;
export const Button: ForwardRef<HTMLButtonElement, ButtonHTMLAttributes & { variant?: "primary" | "secondary" | "quiet" | "link" | "danger"; size?: "sm" | "md" | "lg"; loading?: boolean }>; // default type="button"
export function SourceChip({ source }: { source: FieldSource | null }): JSX.Element;   // words: "From estimate", "Contractor profile", "Chosen on screen", "Homeowner entered", "Bank (Plaid)", "Pay stub"; null → "No source yet"
export function StatusPill({ status }: { status: FieldStatus }): JSX.Element;          // "Ready", "Needs review", "Needs input", "Needs homeowner"
export function TaskLayout(p: { title: string; sub?: string; aside?: ReactNode; centre: ReactNode; right: ReactNode; rightTitle: string; action?: ReactNode }): JSX.Element;
export function Field(p: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string; id: string }): JSX.Element;
export function Notice(p: { tone?: "info" | "check" | "office" | "danger"; children: ReactNode; icon?: ReactNode; className?: string }): JSX.Element;
export function Card(p: { children: ReactNode; className?: string; selected?: boolean }): JSX.Element;
export function Skeleton(p: { className?: string }): JSX.Element;
export function ElapsedTimer(p: { running: boolean; label?: string }): JSX.Element | null;  // "Preparing · 3.2 s"

// apps/web/src/components/Disclosure.tsx
export function Disclosure({ d, full, className }: { d: Disclosures; full?: boolean; className?: string }): JSX.Element; // full adds RESPA_LINE

// apps/web/src/components/Summary.tsx
export function FinancingSummary({ s }: { s: SessionState }): JSX.Element; // reads s.amount, s.selected, s.fields (status counts only), s.decision

// apps/web/src/state/session.ts
export interface SessionState { amount: number; priority: Priority; quote: QuoteResponse | null; selected: Scenario | null; askOpen: boolean; answers: number; contractorId: string; estimateId: string | null; prepared: PreparedApplication | null; fields: PrefillField[]; income: IncomeVerificationResult | null; decision: CreditDecision | null; }
export const session: { get(): SessionState; set(patch: Partial<SessionState> | ((s: SessionState) => Partial<SessionState>)): void; reset(): void; subscribe(l: () => void): () => void };
export function useSession(): SessionState;
export function mergeFields(current: PrefillField[], updates: PrefillField[]): PrefillField[]; // replace by key, append new keys
// sessionStorage key: "goodleap-demo-session-v1"; INITIAL contractorId "C-1001", amount 30000, priority "lower_monthly"

// apps/web/src/lib/api.ts
export class ApiFailure extends Error { status: number; code: string }   // message = server's ApiError message
export const api: { get<T>(path: string): Promise<T>; post<T>(path: string, body: unknown): Promise<T> }; // path WITHOUT "/api", e.g. api.post("/submit", body)

// apps/web/src/router.ts
export type Route = "compare" | "apply" | "verify" | "review" | "audit" | "next";
export function go(route: Route): void;

// @goodleap/shared
export const formatUsd: (n: number) => string;   // $1,234.56
export const formatUsd0: (n: number) => string;  // $30,000
export const ESTIMATE_LINE: string;
```
Types (from `packages/shared/src/types.ts`): `EstimateSample`, `PrefillField`, `FieldGroup`, `FieldStatus`,
`FieldSource`, `AgentStep { n; tool; summary; ms }`, `PrepareRequest`, `PreparedApplication { fields; checklist;
agentSteps; model; latencyMs }`, `PlaidDemoOutcome`, `IncomeVerificationResult { status; source; institution?;
statusLine; fields; explanation?: GuardedAnswer }`, `GuardedAnswer { text; outcome; disclosures; checks; attempts;
auditId; latencyMs }`, `SubmitRequest`, `CreditDecision { decision; referenceId; message; nextSteps; source }`.

Screen idiom: each screen file starts with a 2–4 line comment naming its SCR id and spec, then
`export default function X() { const s = useSession(); … return <TaskLayout … /> }` (as in the Riverside screens,
e.g. `inno-riverside-onboarding/apps/web/src/screens/Scr10.tsx`). The shell focuses the `TaskLayout` heading on arrival.

## 5. Steps

### Step 1 · `application/format.ts` (pure)
```ts
export const MONEY_KEYS = new Set(["project.estimateTotal", "project.downPayment", "financing.financedAmount", "income.grossAnnualIncome"]);
export const GROUPS: { group: FieldGroup; title: string }[] = [
  { group: "project", title: "Project" }, { group: "financing", title: "Financing" }, { group: "contractor", title: "Contractor" },
  { group: "you", title: "About you" }, { group: "income", title: "Income" }];
export function displayValue(f: PrefillField): string   // null → "—"; money key + number → formatUsd; project.projectType → "roof_replacement" → "Roof replacement"; else String(value)
export function parseMoney(input: string): number | null // strip "$", ",", spaces; Number(); finite and ≥ 0 else null
export function editField(f: PrefillField, raw: string, by: "conversation" | "homeowner"): PrefillField | { error: string }
export function recomputeFinanced(fields: PrefillField[]): PrefillField[]
export const isIncomplete = (f: PrefillField) => f.status === "needs_input" || f.status === "needs_authorization";
```
`editField`: money key → `parseMoney`, null → `{ error: "Enter a dollar amount, for example 30000." }`; other keys → trimmed
string, empty → `{ error: "Enter a value." }`. Result: `{ ...f, value, source: by, status: "ready", note: by === "homeowner" ? "Edited by the homeowner" : "Entered by the contractor", confidence: undefined, sourceQuote: undefined }`.
`recomputeFinanced` (deterministic code, never the model): when `project.estimateTotal` and `project.downPayment` are
both numbers, set `financing.financedAmount` to `{ value: Math.round((total − down) * 100) / 100, status: "ready", note: "computed by code from the edited figures", source: financed.source ?? "conversation" }`; otherwise leave it. Call it after every edit of either key.

### Step 2 · `application/FieldsTable.tsx`
```tsx
export function FieldsTable({ fields, mode, onEdit }: { fields: PrefillField[]; mode: "contractor" | "homeowner"; onEdit?: (key: string, raw: string) => string | null /* error or null */ }): JSX.Element
```
- A `<table>` with a visually hidden `<caption>` ("Prefilled fields"), columns: Field · Value · Source · Confidence · Status · (edit).
- Each row `id={`field-${f.key}`}` (used by SCR-5 jump links).
- Value cell: `displayValue(f)`; when `f.status !== "ready"` and `f.note`, show the note under the value in muted 12.5px text (the "reason, never a guess" rule). When `f.note` starts with `"computed by code"`, also show a small "Computed" tag.
- **Contractor mode, `group === "income"`**: value cell is the words "Homeowner will connect", source cell `<SourceChip source={null} />`, status `<StatusPill status="needs_authorization" />`, no edit, no note — **whatever `f.value` holds** (R-12; the session may already hold income after a back-navigation).
- Contractor mode, `group === "you"`: value "Homeowner enters on Review", no edit.
- Source quote: when `f.sourceQuote`, render `<details><summary>Source words</summary><q>{f.sourceQuote}</q></details>` under the value and put the quote in the cell's `title` too.
- Confidence: when `f.confidence !== undefined`, a 64px bar (`<div role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={`Confidence ${pct}%`}>` with an inner bar width `pct%`, `bg-accent`), plus `pct%` text. Absent → "—".
- Edit (when `onEdit` and the row is editable — contractor mode: `project.*`, `financing.financedAmount` is **not** editable (computed), `contractor.*`; homeowner mode: every group except `you` (edited in `IdentityForm`) and `income` and `financing.financedAmount`): a quiet `Button size="sm"` "Edit" (`aria-label={`Edit ${f.label}`}`) toggling an inline `<input>` (16px text, `aria-label={f.label}`), **Save** and **Cancel**; Save calls `onEdit(key, raw)`, shows the returned error inline (`role="alert"`) or closes.

### Step 3 · `application/AgentSteps.tsx`
`export function AgentSteps({ prepared }: { prepared: PreparedApplication })` →
`<details>` (closed by default) with `<summary>` `Agent steps (${n}) · ${(latencyMs/1000).toFixed(1)} s · ${model}`, then an `<ol>`: each item `<code>{step.tool}</code> — {step.summary} · <span className="num">{step.ms} ms</span>`. Under the list, one muted line: "The assistant chose the order of these steps; code checked every result and built the fields."

### Step 4 · `StartApplication.tsx` (SCR-3, contractor)
State: `estimates: EstimateSample[] | null`, `loadError`, `pasted: string`, `phase: "idle" | "preparing" | "error"`, `error: string`.
1. Header comment: `// SCR-3 · Start application (contractor). Spec: docs/ux/03-structure/SCREEN_SPECS.md SCR-3. Income never renders here (R-12).`
2. `useEffect` once: `api.get<EstimateSample[]>("/estimates")` → `setEstimates`; failure → `loadError = e.message`.
3. **No option chosen** (`!s.selected`): centre shows `<Notice tone="check">Choose a financing option on Compare first.</Notice>` with `<Button variant="link" onClick={() => go("compare")}>Go to Compare</Button>`; the picker still renders but **Prepare application** is disabled.
4. Picker: heading "Choose the contractor's estimate". Three `Card`s as `<button aria-pressed={selected}>` (wrap the card content in a `<button>` with full width, left aligned): name, a `<pre>` preview of the first 6 lines of `text` (12px, max-h 9rem, overflow hidden). Click → `session.set({ estimateId: e.id, contractorId: e.contractorId })`, clear `pasted`.
   Below: "Or paste or upload an estimate (.txt)": a `<textarea id="estimate-paste">` with a visible `<label>` (rows 6, maxLength 20000) and an `<input type="file" accept=".txt,text/plain">`; a chosen file is read with `await file.text()` (slice to 20000) into `pasted`. Typing/uploading sets `session.set({ estimateId: null })`. Uploaded text uses `s.contractorId`.
5. **Prepare application** (`Button variant="primary" size="lg"`) enabled when `s.selected` and (`s.estimateId` or `pasted.trim()`). On click: `phase = "preparing"`; body
   `{ ...(s.estimateId ? { estimateId: s.estimateId } : { estimateText: pasted }), contractorId: s.contractorId, productId: s.selected.productId, amount: s.selected.amount, priority: s.priority }` satisfies `PrepareRequest`;
   `const res = await api.post<PreparedApplication>("/application/prepare", body)`; then `session.set({ prepared: res, fields: res.fields, income: null, decision: null })`, `phase = "idle"`. Error → `phase = "error"`, `error = e instanceof ApiFailure ? e.message : "Something went wrong. Try again."`.
   Next to the button: `<ElapsedTimer running={phase === "preparing"} label="Preparing" />`.
6. Below: extracting → three `Skeleton className="h-10"` rows; error → `<Notice tone="danger">{error}</Notice>` with a **Try again** button (re-runs step 5); prepared (`s.prepared`) → `<AgentSteps prepared={s.prepared} />`, then **partial** notice when any field is `needs_input`/`needs_review` outside the `you`/`income` groups: `<Notice tone="check">Some fields need attention. Nothing was guessed: blank fields stay blank until someone confirms them.</Notice>`; then `<FieldsTable fields={s.fields} mode="contractor" onEdit={edit} />`, where `edit(key, raw)` → `editField(f, raw, "conversation")`, then `session.set(st => ({ fields: recomputeFinanced(mergeFields(st.fields, [updated])) }))`.
7. Right (`rightTitle="Financing summary"`): `<FinancingSummary s={s} />`; when `s.prepared`, a card titled "What the homeowner still needs to do" with `<ul>` of `s.prepared.checklist`.
8. `action`: `<Button variant="primary" size="lg" disabled={!s.prepared} onClick={() => go("verify")}>Hand to homeowner</Button>`.
9. Title "Start application", sub "The assistant reads the estimate and fills what it can. Code checks every figure."

### Step 5 · `application/PlaidSheet.tsx` and `ExplanationCard.tsx`
- `PlaidSheet({ open, onPick, onClose }: { open: boolean; onPick: (o: PlaidDemoOutcome) => void; onClose: () => void })`: a native `<dialog>` with a ref; `useEffect` calls `showModal()` when `open` turns true and `close()` when false; listen to the dialog's `close` event → `onClose()`. Content: heading "Demo bank connection", line "Synthetic Plaid Link for the demo. No real bank is contacted.", institution "Demo Credit Union", three buttons: **Connect bank (succeeds)** → `onPick("success")`, **Connect bank (fails)** → `onPick("connection_failed")`, **Not enough history** → `onPick("insufficient_data")`; plus **Cancel** (`variant="quiet"`) → `onClose()`.
- `ExplanationCard({ answer }: { answer: GuardedAnswer })`: a `Card` with a small label "What happened, in plain words", the `answer.text` paragraph, and `<Disclosure d={answer.disclosures} className="mt-2" />`. (B's SCR-2 answer card is not exported; this local card is the same shape. See *Risks* R1.)

### Step 6 · `VerifyIncome.tsx` (SCR-4, homeowner)
State: `sheetOpen`, `busy: false | "plaid" | "document"`, `error`.
1. Header comment naming SCR-4, R-10, R-11, WP-4.
2. `!s.prepared` → centre `<Notice tone="check">Prepare the application first.</Notice>` + link button `go("apply")`; no action enabled.
3. Calm card (`Card`): heading "Verify your income securely"; two short lists: **Shared with the lender:** "your employer and your income, read from your bank deposits"; **Not shared:** "account numbers, balances or transactions". One line: "Your contractor doesn't see this step." **Connect bank** (`variant="primary"`) → `sheetOpen = true`.
4. `run(o: PlaidDemoOutcome)`: close the sheet, `busy = "plaid"`, `res = await api.post<IncomeVerificationResult>("/income/plaid", { demoOutcome: o })`, then `session.set(st => ({ income: res, fields: mergeFields(st.fields, res.fields) }))`. `ElapsedTimer running={busy !== false} label="Connecting"`. Errors → `<Notice tone="danger">`.
5. `uploadStub()`: `busy = "document"`, `api.post<IncomeVerificationResult>("/income/document", {})`, same merge. The button's hint: "Demo: a sample pay stub is used; no file leaves your device."
6. Outcome panel by `s.income?.status`:
   - `verified`: `<Notice tone="office">{statusLine}</Notice>` + `<FieldsTable fields={incomeFields} mode="homeowner" />` (no `onEdit`).
   - `failed`: `<Notice tone="check">{statusLine}</Notice>`, `{s.income.explanation && <ExplanationCard answer={s.income.explanation} />}`, buttons **Try again** (`run("success")`) and **Upload a pay stub instead** (`uploadStub()`).
   - `insufficient`: same notice + card; only **Upload a pay stub instead** (plus **Try again** as `variant="quiet"`).
   - `document_review`: `<Notice tone="check">{statusLine}</Notice>` + income `FieldsTable` (shows "Needs review", "Pay stub", the "computed by code…" note).
   `incomeFields = s.fields.filter(f => f.group === "income")`. Income values are shown here (homeowner screen).
7. Right: `<FinancingSummary s={s} />`. `action`: **Continue to review** (`primary lg`), enabled when `s.income?.status === "verified" || s.income?.status === "document_review"` → `go("review")`.
8. Title "Verify income", sub "Your step. The lender's review decides, not this screen."

### Step 7 · `application/IdentityForm.tsx` and `Review.tsx` (SCR-5, homeowner)
`IdentityForm({ values, onChange }: { values: Identity; onChange: (v: Identity) => void })` with
`export interface Identity { fullName: string; address: string; dateOfBirth: string; ssnLast4: string }` and
`export function identityFields(v: Identity): PrefillField[]` → the four `you.*` fields (labels from `c.md`): non-empty and valid →
`{ value, source: "homeowner", status: "ready" }`; else `{ value: null, source: null, status: "needs_input", note: "Type this to submit." }`.
Valid: `ssnLast4` matches `/^\d{4}$/`; `dateOfBirth` non-empty `YYYY-MM-DD`. Four `<Field>`s, ids `id-fullName`, `id-address`,
`id-dateOfBirth` (`type="date"`), `id-ssnLast4` (`inputMode="numeric"`, `maxLength={4}`, `autoComplete="off"`, hint
"Only the last 4 digits; the lender's credit review uses it"). Row ids `field-you.fullName` etc. on each `Field` wrapper so jump links work.

`Review.tsx`:
1. Header comment naming SCR-5, R-13, R-14. **Identity lives only in `useState<Identity>` here; it is never put in `session`** (session is persisted to `sessionStorage`).
2. `!s.selected || !s.prepared` → notice + link to `go("compare")` / `go("apply")`.
3. `effective = mergeFields(s.fields, identityFields(identity))`.
4. **Incomplete** (`effective.filter(isIncomplete)`): when non-empty, `<Notice tone="check">` "Finish these before you submit:" and a list of buttons (`variant="link"`), each `onClick={() => { const el = document.getElementById(`field-${f.key}`); el?.scrollIntoView({ block: "center" }); el?.querySelector<HTMLElement>("input,button")?.focus(); }}` — **not** `href="#…"` (the router uses the hash).
5. Groups in `GROUPS` order, each a `<section>` with an `<h3>`: `you` → `<IdentityForm …>`; others → `<FieldsTable fields={effective.filter(f => f.group === g)} mode="homeowner" onEdit={edit} />` where `edit` uses `editField(f, raw, "homeowner")` and `session.set(st => ({ fields: recomputeFinanced(mergeFields(st.fields, [updated])) }))`.
6. Consents (three `<input type="checkbox">` with `<label>`s), state `{ disclosuresRead, creditCheck, accurate }`:
   - "I have read the disclosures below." (`disclosuresRead`)
   - "I authorise the lender to check my credit for this application." (`creditCheck`)
   - "The information above is accurate." (`accurate`)
7. `<Disclosure d={s.selected.disclosures} full />`.
8. Submit (`action`, `primary lg`) **Submit application**, `disabled` until all three consents and no incomplete rows; `loading` while submitting. Body `{ productId: s.selected.productId, amount: s.selected.amount, fields: effective, consents }` (`SubmitRequest`) → `api.post<CreditDecision>("/submit", body)` → `session.set({ decision: res })`, then `setIdentity(EMPTY_IDENTITY)`. Error → `<Notice tone="danger">{e.message}</Notice>`.
9. **Submitted** (`s.decision`): render the result card at the top of the centre (and hide the consents and submit): heading "Sent to the lender's credit review"; `Decision: Pending` or `Decision: Received with conditions` (map `pending`/`conditional`; any other value renders as "Decision: see the lender's response" — the engine never sends approved); `s.decision.message`; `nextSteps` as a list when non-empty; `Reference ${referenceId}`; the sentence **"This result comes from the credit decision engine, not from this assistant."**; two buttons: "See the compliance audit" → `go("audit")`, "Where we'd take it next" → `go("next")`.
10. Right: `<FinancingSummary s={{ ...s, fields: effective }} />` (counts only; R-12 does not apply to SCR-5).
11. Title "Review and submit", sub "Check every field. You can change anything before you submit."

### Step 8 · copy rules (brief-conformance §1)
No UI string says or implies approval or eligibility: never "qualify", "approved", "pre-approved", "eligible",
"guaranteed", "no risk", "you can afford". Run `grep -niE "qualif|approv|eligib|guarantee|no risk|afford" apps/web/src/screens/StartApplication.tsx apps/web/src/screens/VerifyIncome.tsx apps/web/src/screens/Review.tsx apps/web/src/screens/application/` — expected: no matches.

## 6. Data and fixtures

Synthetic only, all from the live API (c1) over `data/synthetic/`: the three estimates, Plaid outcomes, the pay stub
($2,650.00 biweekly → $68,900.00 computed by code), engine outcomes `CD-DEMO-0001` (pending) and `CD-DEMO-0002`
(conditional, 2 next steps). Identity typed in the screenshot run: "Demo Homeowner", "1500 Demo Ln, Austin, TX 78704",
`1985-04-12`, `1234` (synthetic).

## 7. Checks

While iterating: open `http://127.0.0.1:5173/#/apply` etc. (already running). Before reporting, once:
`npm run typecheck` and
`npx eslint apps/web/src/screens/StartApplication.tsx apps/web/src/screens/VerifyIncome.tsx apps/web/src/screens/Review.tsx apps/web/src/screens/application`.
No unit tests are planned for the web (vitest covers `apps/server/test/**` only, per `vitest.config.ts`); the
behaviour checks are the click paths, run by the screenshot script.

**Click paths** (A happy, B friction, C review/submit, D error, E no option):
- A: Compare state seeded → `#/apply` → pick "Roof replacement (handwritten-style estimate)" → **Prepare application** → timer runs → agent steps (≤ 6) → table: down payment $2,000.00, amount to finance $28,000.00 "Needs review" (differs from the 30,000 quote), income rows "Homeowner will connect" → checklist → **Hand to homeowner**.
- B: `#/verify` → **Connect bank** → **Connect bank (fails)** → status line ending "Nothing was submitted and no decision was made." + explanation card + disclosure line → **Upload a pay stub instead** → income rows $68,900.00 "Pay stub" "Needs review" with the computed note → **Continue to review**.
- C: `#/review` → incomplete list shows the four identity fields → type them → list empties → tick three consents → **Submit application** → result card "Decision: Received with conditions", 2 next steps, "Reference CD-DEMO-0002", the engine sentence.
- D (error state): no live fault injection. Check by reading the code that every `api.get`/`api.post` call has a `catch` that renders `<Notice tone="danger">` with the `ApiFailure` message and a way to retry; on SCR-3, pasting `x` as the estimate and preparing must end in either a prepared table (fields `needs_input`) or the danger notice, never a blank screen.
- E: clear session (rail **Start over**) → `#/apply` shows the Compare link and Prepare disabled.
- R-12 check: after B, go to `#/apply`; page text has no "68,900".

**Screenshots** (`var/c2-screens.mjs`, run from the repo root with `node var/c2-screens.mjs`; Playwright 1.64.1 from the
root `node_modules`, chromium cached in `~/.cache/ms-playwright`; headless; viewport 1440×900; light scheme). Script outline:
1. `page.goto("http://127.0.0.1:5173/#/compare")`; in the page, `fetch("/api/quote", { method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify({ amount: 30000, priority: "lower_monthly" }) })`.
   - 200 → take the scenario with `productId === "GL-FIX-10"` (else `scenarios[0]`), write `sessionStorage["goodleap-demo-session-v1"] = JSON.stringify({ amount: 30000, priority: "lower_monthly", quote, selected })`.
   - 501 (segment A not merged yet) → print `"BLOCKED: /api/quote not built (segment A); screenshots pending"` and exit 2. **Never fabricate a Scenario with invented numbers for a screenshot.** Report the screenshots as pending, with everything else done; rerun when A lands.
   - If `/api/application/prepare` returns 501 (c1 not merged), likewise print `BLOCKED: c1 routes` and exit 2.
2. `goto #/apply`, reload; click the card containing "handwritten-style"; click **Prepare application**; wait (≤ 60 s) for text "Agent steps"; click the `summary` to expand; `page.screenshot({ path: "docs/artifacts/screens/scr-3-apply.png", fullPage: true })`.
3. Click **Hand to homeowner**; click **Connect bank**; click **Connect bank (fails)**; wait for "Nothing was submitted and no decision was made."; screenshot `docs/artifacts/screens/scr-4-verify-failed.png`.
4. Click **Upload a pay stub instead**; wait for "computed by code"; click **Continue to review**; fill by label "Full name", "Home address", "Date of birth", "SSN (last 4 digits)"; assert `sessionStorage` JSON does not contain "Demo Homeowner" (print PASS/FAIL); check the three consents; click **Submit application**; wait for "Sent to the lender's credit review"; screenshot `docs/artifacts/screens/scr-5-review.png`.
5. `goto #/apply`; assert page text does not include "68,900" (print PASS/FAIL; R-12).
Report the PASS/FAIL lines and the three paths. Delete nothing; `var/` is scratch.

## 8. Risks and requests

- **R1 (B, optional).** SCREEN_SPECS says the SCR-4 explanation card is "same component as SCR-2 answers". B's answer
  card is not a shared export; c2 builds `application/ExplanationCard.tsx`. Request: at integration, the orchestrator
  may swap it for B's component if B exports one.
- **R2 (types, optional).** `FieldSource` has no contractor value; contractor edits on SCR-3 use `conversation`
  ("Chosen on screen") with note "Entered by the contractor". A `contractor` source needs a Foundation change to
  `types.ts` and `SourceChip`.
- **R3 (choice).** Identity values stay in component state on SCR-5 and are never written to `session`
  (sessionStorage). Leaving SCR-5 before submitting clears them; that is intended.
- **R4 (dependency).** Live click paths and screenshots need c1's routes and segment A's `/api/quote`. The script
  exits 2 with a named blocker rather than inventing data.
- **R5.** `Shell.tsx` marks step 4 done when `income.status` is `verified` or `document_review`; matches this plan.

## 9. Readiness

**READY.** Building does not wait on anything: the contract (`c.md`, `types.ts`) is fixed and the server stubs answer
501. Open items: `RUNTIME` — screenshots and the live click paths, which depend on c1 and segment A being merged
(outcome handling in §7); `FREEDOM` — exact Tailwind classes and spacing within the Foundation primitives.
