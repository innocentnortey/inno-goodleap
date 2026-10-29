// SCR-5 · Review and submit (homeowner). Spec: SCREEN_SPECS SCR-5; PRD R-13 (edits become homeowner-sourced), R-14 (no model in submit).
// Identity lives only in useState here and is never written to `session` (which is persisted to sessionStorage).
import { useState } from "react";
import { Disclosure } from "../components/Disclosure";
import { FinancingSummary } from "../components/Summary";
import { Button, Card, Notice, TaskLayout } from "../components/ui";
import { ApiFailure, api } from "../lib/api";
import { go } from "../router";
import { mergeFields, session, useSession } from "../state/session";
import type { CreditDecision } from "@goodleap/shared";
import { FieldsTable } from "./application/FieldsTable";
import { MismatchNotice } from "./application/MismatchNotice";
import { EMPTY_IDENTITY, IdentityForm, identityFields, type Identity } from "./application/IdentityForm";
import { GROUPS, editField, isIncomplete, financedError, recomputeFinanced } from "./application/format";

const DECISION_WORD: Record<string, string> = { pending: "Pending", conditional: "Received with conditions" };

export default function Review() {
  const s = useSession();
  const [identity, setIdentity] = useState<Identity>(EMPTY_IDENTITY);
  const [consents, setConsents] = useState({ disclosuresRead: false, creditCheck: false, accurate: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!s.selected || !s.prepared) {
    return (
      <TaskLayout title="Review and submit" sub="Check every field. You can change the project details and your own details before you submit."
        centre={<Notice tone="check">Nothing to review yet.{" "}
          <Button variant="link" size="sm" onClick={() => go(s.selected ? "apply" : "compare")}>{s.selected ? "Go to Start application" : "Go to Compare"}</Button></Notice>}
        right={<FinancingSummary s={s} />} rightTitle="Financing summary" />
    );
  }
  const selected = s.selected;

  const effective = mergeFields(s.fields, identityFields(identity));
  const incomplete = effective.filter(isIncomplete);
  const allConsented = consents.disclosuresRead && consents.creditCheck && consents.accurate;

  function edit(key: string, raw: string): string | null {
    const f = session.get().fields.find((x) => x.key === key);
    if (!f) return "That field is no longer available.";
    const r = editField(f, raw, "homeowner");
    if ("error" in r) return r.error;
    const bad = financedError(mergeFields(session.get().fields, [r]));
    if (bad) return bad;
    session.set((st) => ({ fields: recomputeFinanced(mergeFields(st.fields, [r]), "homeowner", st.selected?.amount) }));
    return null;
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post<CreditDecision>("/submit", { productId: selected.productId, amount: selected.amount, fields: effective, consents });
      session.set({ decision: res });
      setIdentity(EMPTY_IDENTITY);
    } catch (e) {
      setError(e instanceof ApiFailure ? e.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const financed = effective.find((f) => f.key === "financing.financedAmount")?.value;
  const mismatch = typeof financed === "number" && Math.abs(financed - selected.amount) > 0.004;

  const jump = (key: string) => {
    const el = document.getElementById(`field-${key}`);
    el?.scrollIntoView({ block: "center" });
    el?.querySelector<HTMLElement>("input,button")?.focus();
  };

  const d = s.decision;
  const centre = (
    <>
      {d && (
        <Card selected className="shrink-0">
          <h3 className="m-0 text-[17px] font-extrabold">Sent to the lender's credit review</h3>
          <p className="mb-1 mt-2 text-[14.5px] font-bold">Decision: {DECISION_WORD[d.decision] ?? "see the lender's response"}</p>
          <p className="m-0 text-[14px]">{d.message}</p>
          {d.nextSteps.length > 0 && <ul className="mb-0 mt-2 list-disc pl-5 text-[13.5px]">{d.nextSteps.map((n) => <li key={n}>{n}</li>)}</ul>}
          <p className="num mb-1 mt-3 text-[13px] font-bold">Reference {d.referenceId}</p>
          <p className="m-0 text-[13px] text-muted">This result comes from the credit decision engine, not from this assistant.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => go("audit")}>See the compliance audit</Button>
            <Button onClick={() => go("next")}>Where we'd take it next</Button>
          </div>
        </Card>
      )}
      {d && <Disclosure d={selected.disclosures} full />}
      {!d && incomplete.length > 0 && (
        <Notice tone="check">
          <p className="m-0 font-bold">Finish these before you submit:</p>
          <ul className="m-0 flex list-none flex-wrap gap-x-3 p-0">
            {incomplete.map((f) => f.group === "income"
              ? <li key={f.key}><Button variant="link" size="sm" onClick={() => go("verify")}>Verify income</Button></li>
              : <li key={f.key}><Button variant="link" size="sm" onClick={() => jump(f.key)}>{f.label}</Button></li>)}
          </ul>
        </Notice>
      )}
      {mismatch && <MismatchNotice financed={financed as number} compared={selected.amount} />}
      {GROUPS.map(({ group, title }) => (
        <section key={group} aria-labelledby={`h-${group}`} className="flex shrink-0 flex-col gap-2">
          <h3 id={`h-${group}`} className="m-0 text-[14.5px] font-extrabold">{title}</h3>
          {group === "you" && d
            ? <p className="m-0 text-[13.5px] text-muted">Provided. Your personal details are not kept on this device.</p>
            : group === "you"
              ? <IdentityForm values={identity} onChange={setIdentity} />
              : <FieldsTable fields={effective.filter((f) => f.group === group)} mode="homeowner" onEdit={d ? undefined : edit} />}
        </section>
      ))}
      {!d && (
        <>
          <fieldset className="flex flex-col gap-2 rounded-2xl border border-line p-4">
            <legend className="px-1 text-[13px] font-bold">Consents</legend>
            {([
              ["disclosuresRead", "I have read the disclosures below."],
              ["creditCheck", "I authorise the lender to check my credit for this application."],
              ["accurate", "The information above is accurate."],
            ] as const).map(([k, label]) => (
              <label key={k} className="flex items-start gap-2 text-[14px]">
                <input type="checkbox" className="mt-1 size-4" checked={consents[k]} onChange={(e) => setConsents((c) => ({ ...c, [k]: e.target.checked }))} />
                {label}
              </label>
            ))}
          </fieldset>
          <Disclosure d={selected.disclosures} full />
          {error && <Notice tone="danger">{error}</Notice>}
        </>
      )}
    </>
  );

  return (
    <TaskLayout title="Review and submit" sub="Check every field. You can change the project details and your own details before you submit."
      centre={centre} right={<FinancingSummary s={{ ...s, fields: effective }} />} rightTitle="Financing summary"
      action={d ? undefined : <Button variant="primary" size="lg" loading={submitting} disabled={!allConsented || incomplete.length > 0} onClick={() => void submit()}>Submit application</Button>} />
  );
}
