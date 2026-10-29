# User flows, states and sitemap (UX-1, light mode)

Layout substitution: the sitemap lives in this file (one app, seven screens) instead of a separate `SITEMAP.md`.
Contracts: no `CON-N` cards (skip S-2); each data step names its route in `packages/shared/src/types.ts` instead.

## Sitemap (step rail order)

```
/                 → redirects to /compare
/compare          SCR-1 Compare options           (contractor + homeowner)
  └ panel         SCR-2 Ask about this option     (homeowner)
/apply            SCR-3 Start application         (contractor)
/verify           SCR-4 Verify income             (homeowner · "hand to homeowner" boundary)
/review           SCR-5 Review and submit         (homeowner)
/audit            SCR-6 Compliance audit          (reviewer; always reachable from the top bar)
/next             SCR-7 Where we'd take it next   (reviewer; always reachable)
```

## Flow A · Happy path

```
[SCR-1] enter 30,000 → pick priority → POST /api/quote → 6 scenarios, top 3 large
   │  select GL-DEF-18 → "Ask about this option"
   ▼
[SCR-2] question → POST /api/ask → guardrails → answer + disclosures (audit record written)
   │  "Start application with this option"
   ▼
[SCR-3] pick / upload estimate → POST /api/application/prepare → agent steps (≤6) → PrefillField[] + checklist
   │  "Hand to homeowner"
   ▼
[SCR-4] Connect bank (succeeds) → income fields (source plaid) → "Continue"
   ▼
[SCR-5] review fields → edit if needed → tick consents → POST /api/submit → engine: pending | conditional
   ▼
[done]  result card with reference id · links to /audit and /next
```

## Flow B · Friction case (Plaid failure)

```
… same to [SCR-4]
[SCR-4] Connect bank (fails) → INSTITUTION_MFA_TIMEOUT
        → status line (template) + guarded explanation (audit record)
        → [Try again] → success path    |    [Upload a pay stub] → document income → fields (source document, needs_review)
        → "Continue" → [SCR-5] as above; engine returns conditional ("confirm income documentation")
```

## States per screen

| Screen | States | Recovery |
|---|---|---|
| SCR-1 | empty (no amount) · loading · results · **error: amount out of range** · error: server | Inline message with the valid range; retry |
| SCR-2 | closed · idle (suggested questions) · thinking (timer) · answered · **redirected** (eligibility / off-topic) · **safe template** (guardrail failed twice) · error | Safe template is a valid end state; "Ask something else" |
| SCR-3 | no estimate · extracting (agent steps streaming or appearing) · prepared (fields + checklist) · **partial** (needs_input / needs_review rows) · error (unreadable file) | Partial is normal; "Add manually" per field; re-upload |
| SCR-4 | not started · connecting · **verified** · **failed** (explanation + 2 actions) · insufficient (explanation + document path) · document uploaded (needs_review) | Try again / document path; never a dead end |
| SCR-5 | reviewing (editable) · incomplete (needs_input rows block submit) · submitting · **submitted (pending / conditional)** · error | Incomplete rows are listed at the top with jump links |
| SCR-6 | empty · list · record detail (raw vs final, checks) | — |
| SCR-7 | static page | — |

## Permissions (who sees what)

| Data | Contractor screens (1–3) | Homeowner screens (4–5) | Audit (6) |
|---|---|---|---|
| Amount, scenarios, estimate fields | yes | yes | yes |
| Income values (Plaid / document) | **no** (R-12) | yes | masked to a source + status |
| Homeowner identity fields | entered by homeowner only | yes | masked |
| Model raw output, checks | no | no | yes |

## Data steps → shared types

| Step | Route | Request → Response types |
|---|---|---|
| Quote | `POST /api/quote` | `QuoteRequest` → `Scenario[]` |
| Ask | `POST /api/ask` | `AskRequest` → `GuardedAnswer` |
| Prepare | `POST /api/application/prepare` | `PrepareRequest` → `PreparedApplication { fields: PrefillField[], checklist, agentSteps }` |
| Verify | `POST /api/income/plaid` · `POST /api/income/document` | `{ demoOutcome }` → `IncomeVerificationResult` |
| Submit | `POST /api/submit` | `Application` → `CreditDecision` |
| Audit | `GET /api/audit` | → `AuditRecord[]` |
