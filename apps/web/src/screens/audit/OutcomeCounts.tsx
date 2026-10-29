import type { AnswerOutcome, AuditRecord } from "@goodleap/shared";
import { Card } from "../../components/ui";
import { OUTCOME_WORD } from "./words";

const ORDER: AnswerOutcome[] = ["shown", "regenerated", "redirected", "safe_template"];

export function OutcomeCounts({ records }: { records: AuditRecord[] }) {
  return (
    <Card>
      <h3 className="m-0 mb-2 text-[13px] font-extrabold">Counts in this log</h3>
      <dl className="m-0 flex flex-col gap-1.5 text-[13px]">
        {ORDER.map((o) => (
          <div key={o} className="flex justify-between gap-2">
            <dt>{OUTCOME_WORD[o]}</dt>
            <dd className="num m-0 font-bold">{records.filter((r) => r.outcome === o).length}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-2 border-t border-line pt-1.5"><dt>Total</dt><dd className="num m-0 font-bold">{records.length}</dd></div>
      </dl>
    </Card>
  );
}
