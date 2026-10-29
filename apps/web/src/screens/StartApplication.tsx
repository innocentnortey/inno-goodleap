// SCR-3 · Start application (contractor). Spec: docs/ux/03-structure/SCREEN_SPECS.md SCR-3. Income never renders here (R-12).
import { useCallback, useEffect, useRef, useState } from "react";
import { FinancingSummary } from "../components/Summary";
import { Button, Card, ElapsedTimer, Notice, Skeleton, TaskLayout, cx } from "../components/ui";
import { ApiFailure, api } from "../lib/api";
import { go } from "../router";
import { mergeFields, session, useSession } from "../state/session";
import type { EstimateSample, PreparedApplication } from "@goodleap/shared";
import { AgentSteps } from "./application/AgentSteps";
import { FieldsTable } from "./application/FieldsTable";
import { MismatchNotice } from "./application/MismatchNotice";
import { editField, financedError, recomputeFinanced } from "./application/format";

export default function StartApplication() {
  const s = useSession();
  const [estimates, setEstimates] = useState<EstimateSample[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [pasted, setPasted] = useState("");
  const [phase, setPhase] = useState<"idle" | "preparing" | "error">("idle");
  const [error, setError] = useState("");

  const token = useRef(0);

  const loadEstimates = useCallback(() => {
    setLoadError("");
    api.get<EstimateSample[]>("/estimates").then(setEstimates).catch((e) => setLoadError(e instanceof ApiFailure ? e.message : "Could not load the sample estimates."));
  }, []);
  useEffect(() => { loadEstimates(); }, [loadEstimates]);
  // A response that arrives after Start over (selected cleared) or a newer prepare is ignored.
  useEffect(() => { if (!s.selected) token.current += 1; }, [s.selected]);

  const canPrepare = !!s.selected && (!!s.estimateId || pasted.trim() !== "") && phase !== "preparing";

  async function prepare() {
    if (!s.selected) return;
    const mine = ++token.current;
    setPhase("preparing");
    setError("");
    try {
      const body = {
        ...(s.estimateId ? { estimateId: s.estimateId } : { estimateText: pasted }),
        contractorId: s.contractorId, productId: s.selected.productId, amount: s.selected.amount, priority: s.priority,
      };
      const res = await api.post<PreparedApplication>("/application/prepare", body);
      if (mine !== token.current) return;
      session.set({ prepared: res, fields: res.fields, income: null, decision: null });
      setPhase("idle");
    } catch (e) {
      if (mine !== token.current) return;
      setError(e instanceof ApiFailure ? e.message : "Something went wrong. Try again.");
      setPhase("error");
    }
  }

  function edit(key: string, raw: string): string | null {
    const f = session.get().fields.find((x) => x.key === key);
    if (!f) return "That field is no longer available.";
    const r = editField(f, raw, "conversation");
    if ("error" in r) return r.error;
    const merged = mergeFields(session.get().fields, [r]);
    const bad = financedError(merged);
    if (bad) return bad;
    session.set((st) => ({ fields: recomputeFinanced(mergeFields(st.fields, [r]), "conversation", st.selected?.amount) }));
    return null;
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setPasted((await file.text()).slice(0, 20000));
    session.set({ estimateId: null });
  }

  const financed = s.fields.find((f) => f.key === "financing.financedAmount")?.value;
  const mismatch = typeof financed === "number" && !!s.selected && Math.abs(financed - s.selected.amount) > 0.004;

  const centre = (
    <>
      {!s.selected && (
        <Notice tone="check">
          Choose a financing option on Compare first.{" "}
          <Button variant="link" size="sm" onClick={() => go("compare")}>Go to Compare</Button>
        </Notice>
      )}
      <section className="flex shrink-0 flex-col gap-3" aria-labelledby="pick-h">
        <h3 id="pick-h" className="m-0 text-[14.5px] font-extrabold">Choose the contractor's estimate</h3>
        {loadError && (
          <Notice tone="danger">
            <p className="m-0">{loadError}</p>
            <Button className="mt-2" size="sm" onClick={loadEstimates}>Try again</Button>
          </Notice>
        )}
        {!estimates && !loadError && <Skeleton className="h-24" />}
        <div className="grid gap-3 md:grid-cols-3">
          {estimates?.map((e) => {
            const selected = s.estimateId === e.id;
            return (
              <div key={e.id} className={cx("rounded-2xl border bg-surface", selected ? "border-accent ring-2 ring-[color-mix(in_srgb,var(--accent)_30%,transparent)]" : "border-line")}>
                <button type="button" aria-pressed={selected} className="flex w-full flex-col gap-2 rounded-2xl p-3 text-left"
                  onClick={() => { session.set({ estimateId: e.id, contractorId: e.contractorId }); setPasted(""); }}>
                  <span className="text-[13.5px] font-bold">{e.name}</span>
                  <span className="m-0 block max-h-36 overflow-hidden whitespace-pre-wrap text-[12px] text-muted">{e.text.split("\n").slice(0, 6).join("\n")}</span>
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="estimate-paste" className="text-[13px] font-bold">Or paste or upload an estimate (.txt)</label>
          <textarea id="estimate-paste" rows={6} maxLength={20000} value={pasted}
            className="rounded-xl border border-line bg-surface p-3 text-[16px]"
            onChange={(e) => { setPasted(e.target.value); session.set({ estimateId: null }); }} />
          <input type="file" accept=".txt,text/plain" aria-label="Upload an estimate" className="text-[13px]" onChange={(e) => void onFile(e.target.files?.[0])} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant={s.prepared ? "secondary" : "primary"} size="lg" disabled={!canPrepare} loading={phase === "preparing"} onClick={() => void prepare()}>Prepare application</Button>
          <ElapsedTimer running={phase === "preparing"} label="Preparing" />
        </div>
      </section>
      {phase === "preparing" && <div className="flex flex-col gap-2"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div>}
      {phase === "error" && (
        <Notice tone="danger">
          <p className="m-0">{error}</p>
          <Button className="mt-2" size="sm" onClick={() => void prepare()}>Try again</Button>
        </Notice>
      )}
      {s.prepared && phase === "idle" && (
        <>
          <AgentSteps prepared={s.prepared} />
          {s.fields.some((f) => (f.status === "needs_input" || f.status === "needs_review") && f.group !== "you" && f.group !== "income") && (
            <Notice tone="check">Some fields need attention. Nothing was guessed: blank fields stay blank until someone confirms them.</Notice>
          )}
          {mismatch && <MismatchNotice financed={financed as number} compared={s.selected!.amount} />}
          <FieldsTable fields={s.fields} mode="contractor" onEdit={edit} />
        </>
      )}
    </>
  );

  const right = (
    <>
      <FinancingSummary s={s} />
      {s.prepared && (
        <Card>
          <h3 className="m-0 mb-2 text-[13.5px] font-extrabold">What the homeowner still needs to do</h3>
          <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-[13px]">{s.prepared.checklist.map((c) => <li key={c}>{c}</li>)}</ul>
        </Card>
      )}
    </>
  );

  return (
    <TaskLayout title="Start application" sub="The assistant reads the estimate and fills what it can. Code checks every figure."
      centre={centre} right={right} rightTitle="Financing summary"
      action={<Button variant="primary" size="lg" disabled={!s.prepared} onClick={() => go("verify")}>Hand to homeowner</Button>} />
  );
}
