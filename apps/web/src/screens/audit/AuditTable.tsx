import type { AuditRecord } from "@goodleap/shared";
import { cx } from "../../components/ui";
import { OUTCOME_WORD, PURPOSE_WORD } from "./words";

export function AuditTable({ records, selectedId, onSelect }: { records: AuditRecord[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full border-collapse text-left text-[13px]">
        <thead>
          <tr className="bg-raised text-[11.5px] uppercase tracking-wide text-muted">
            {["Time", "Screen", "Purpose", "Product", "Outcome", "Latency"].map((h) => <th key={h} scope="col" className="px-3 py-2 font-bold">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} data-audit-row onClick={() => onSelect(r.id)}
              className={cx("cursor-pointer border-t border-line hover:bg-raised", r.id === selectedId && "bg-soft")}>
              <td className="px-3 py-2"><button type="button" aria-current={r.id === selectedId ? "true" : undefined} className="font-bold text-accent underline underline-offset-2" onClick={() => onSelect(r.id)}>{new Date(r.time).toLocaleTimeString()}</button></td>
              <td className="px-3 py-2">{r.screen}</td>
              <td className="px-3 py-2">{PURPOSE_WORD[r.purpose]}</td>
              <td className="px-3 py-2">{r.productId ?? "—"}</td>
              <td className="px-3 py-2">{OUTCOME_WORD[r.outcome]}</td>
              <td className="num px-3 py-2">{(r.latencyMs / 1000).toFixed(1)} s</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
