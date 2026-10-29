// SCR-4 · Verify income (homeowner). Spec: SCREEN_SPECS SCR-4; PRD R-10, R-11 (AI never judges income); worked pair WP-4.
import { useEffect, useRef, useState } from "react";
import { FinancingSummary } from "../components/Summary";
import { Button, Card, ElapsedTimer, Notice, TaskLayout } from "../components/ui";
import { ApiFailure, api } from "../lib/api";
import { go } from "../router";
import { mergeFields, session, useSession } from "../state/session";
import type { IncomeVerificationResult, PlaidDemoOutcome } from "@goodleap/shared";
import { ExplanationCard } from "./application/ExplanationCard";
import { FieldsTable } from "./application/FieldsTable";
import { PlaidSheet } from "./application/PlaidSheet";

export default function VerifyIncome() {
  const s = useSession();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState<false | "plaid" | "document">(false);
  const [error, setError] = useState("");
  const [lastKind, setLastKind] = useState<"plaid" | "document">("plaid");
  const resultRef = useRef<HTMLDivElement>(null);
  const [focusResult, setFocusResult] = useState(0);
  useEffect(() => { if (focusResult) resultRef.current?.focus(); }, [focusResult]);

  async function call(kind: "plaid" | "document", path: string, body: unknown) {
    setSheetOpen(false);
    setBusy(kind);
    setLastKind(kind);
    setError("");
    try {
      const res = await api.post<IncomeVerificationResult>(path, body);
      session.set((st) => ({ income: res, fields: mergeFields(st.fields, res.fields) }));
    } catch (e) {
      setError(e instanceof ApiFailure ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
      setFocusResult((n) => n + 1);
    }
  }
  const run = (o: PlaidDemoOutcome) => call("plaid", "/income/plaid", { demoOutcome: o });
  const uploadStub = () => call("document", "/income/document", {});

  const inc = s.income;
  const incomeFields = s.fields.filter((f) => f.group === "income");
  const ready = inc?.status === "verified" || inc?.status === "document_review";

  const centre = !s.prepared ? (
    <Notice tone="check">Prepare the application first. <Button variant="link" size="sm" onClick={() => go("apply")}>Go to Start application</Button></Notice>
  ) : (
    <>
      <Card>
        <h3 className="m-0 text-[16px] font-extrabold">Verify your income securely</h3>
        <p className="mb-1 mt-3 text-[13px] font-bold">Shared with the lender:</p>
        <ul className="m-0 list-disc pl-5 text-[13.5px]"><li>your employer and your income, read from your bank deposits</li></ul>
        <p className="mb-1 mt-3 text-[13px] font-bold">Not shared:</p>
        <ul className="m-0 list-disc pl-5 text-[13.5px]"><li>account numbers, balances or transactions</li></ul>
        <p className="mt-3 text-[13px] text-muted">Your contractor doesn't see this step.</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant={inc ? "secondary" : "primary"} disabled={!!busy} onClick={() => setSheetOpen(true)}>Connect bank</Button>
          <ElapsedTimer running={busy !== false} label={lastKind === "document" ? "Reading pay stub" : "Connecting"} />
        </div>
      </Card>
      <div ref={resultRef} tabIndex={-1} className="flex shrink-0 flex-col gap-3 outline-none">
      {error && <Notice tone="danger">{error}</Notice>}
      {inc?.status === "verified" && (
        <>
          <Notice tone="office">{inc.statusLine}</Notice>
          <FieldsTable fields={incomeFields} mode="homeowner" />
        </>
      )}
      {(inc?.status === "failed" || inc?.status === "insufficient") && (
        <>
          <Notice tone="check">{inc.statusLine}</Notice>
          {inc.explanation && <ExplanationCard answer={inc.explanation} />}
          <div className="flex flex-wrap items-start gap-3">
            {inc.status === "failed" ? (
              <>
                <Button disabled={!!busy} onClick={() => void run("success")}>Try again</Button>
                <Button disabled={!!busy} onClick={() => void uploadStub()}>Upload a pay stub instead</Button>
              </>
            ) : (
              <>
                <Button disabled={!!busy} onClick={() => void uploadStub()}>Upload a pay stub instead</Button>
                <Button variant="quiet" disabled={!!busy} onClick={() => void run("success")}>Try again</Button>
              </>
            )}
          </div>
          <p className="m-0 text-[12.5px] text-muted">Demo: a sample pay stub is used; no file leaves your device.</p>
        </>
      )}
      {inc?.status === "document_review" && (
        <>
          <Notice tone="check">{inc.statusLine}</Notice>
          <FieldsTable fields={incomeFields} mode="homeowner" />
        </>
      )}
      </div>
      {!inc && (
        <p className="m-0 text-[13px] text-muted">
          Prefer not to connect a bank?{" "}
          <Button variant="link" size="sm" disabled={!!busy} onClick={() => void uploadStub()}>Upload a pay stub instead</Button>
        </p>
      )}
      <PlaidSheet open={sheetOpen} onPick={(o) => void run(o)} onClose={() => setSheetOpen(false)} />
    </>
  );

  return (
    <TaskLayout title="Verify income" sub="Your step. The lender's review decides, not this screen."
      centre={centre} right={<FinancingSummary s={s} />} rightTitle="Readiness"
      action={<Button variant="primary" size="lg" disabled={!ready} onClick={() => go("review")}>Continue to review</Button>} />
  );
}
