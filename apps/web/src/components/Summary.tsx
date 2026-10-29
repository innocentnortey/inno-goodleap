// The right-hand "Financing summary" every journey screen shows (SCREEN_SPECS: amount, chosen option, monthly, total;
// then application readiness). Reads the session only. Income values never appear here (R-12): readiness counts only.
// Owned by Foundation.
import { formatPct, formatUsd, formatUsd0, type FieldStatus } from "@goodleap/shared";
import type { SessionState } from "../state/session";

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex items-baseline justify-between gap-3 text-[13.5px]"><span className="text-muted">{k}</span><b className="num text-right">{v}</b></div>;
}

export function FinancingSummary({ s }: { s: SessionState }) {
  const sc = s.selected;
  const counts = s.fields.reduce<Record<FieldStatus, number>>((acc, f) => { if (f.status in acc) acc[f.status] += 1; return acc; }, { ready: 0, needs_review: 0, needs_input: 0, needs_authorization: 0 });
  return (
    <>
      <div className="g-lavender flex flex-col gap-1.5 rounded-2xl p-4">
        <Row k="Project amount" v={formatUsd0(s.amount)} />
        <Row k="Option" v={sc ? sc.productName : "Not chosen yet"} />
        {sc && <>
          <Row k="Estimated monthly" v={formatUsd(sc.monthlyPayment)} />
          <Row k="APR · term" v={`${formatPct(sc.aprPct)} · ${sc.termMonths} mo`} />
          <Row k="Estimated total paid" v={formatUsd(sc.totalPaid)} />
        </>}
      </div>
      {s.fields.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-2xl border border-line p-4">
          <p className="m-0 text-[12px] font-bold uppercase tracking-wide text-muted">Application readiness</p>
          <Row k="Ready" v={String(counts.ready)} />
          <Row k="Needs review" v={String(counts.needs_review)} />
          <Row k="Needs input" v={String(counts.needs_input)} />
          <Row k="Needs homeowner" v={String(counts.needs_authorization)} />
        </div>
      )}
      {s.decision && <p className="m-0 text-[13px] text-muted">Sent to the lender's credit review · {s.decision.referenceId}</p>}
    </>
  );
}
