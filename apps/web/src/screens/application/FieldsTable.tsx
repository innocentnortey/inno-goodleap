// Prefilled fields table: value · source · confidence · status · edit. Income is never shown in contractor mode (R-12).
import { useState } from "react";
import type { PrefillField } from "@goodleap/shared";
import { Button, SourceChip, StatusPill } from "../../components/ui";
import { displayValue } from "./format";

type Mode = "contractor" | "homeowner";

function editable(f: PrefillField, mode: Mode): boolean {
  if (f.key === "financing.financedAmount") return false;
  if (mode === "contractor") return f.group === "project" || f.group === "contractor";
  return f.group !== "you" && f.group !== "income";
}

function Row({ f, mode, onEdit }: { f: PrefillField; mode: Mode; onEdit?: (key: string, raw: string) => string | null }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const hidden = mode === "contractor" && (f.group === "income" || f.group === "you");
  const pct = f.confidence !== undefined ? Math.round(f.confidence * 100) : null;

  const save = () => {
    const e = onEdit?.(f.key, raw) ?? null;
    if (e) setErr(e); else { setErr(null); setEditing(false); }
  };

  return (
    <tr id={`field-${f.key}`} className="border-t border-line align-top">
      <th scope="row" className="py-2 pr-3 text-left text-[13px] font-bold">{f.label}</th>
      <td className="py-2 pr-3 text-[13.5px]" title={hidden ? undefined : f.sourceQuote}>
        {hidden ? (
          <span className="text-muted">{f.group === "income" ? "Homeowner will connect" : "Homeowner enters on Review"}</span>
        ) : editing ? (
          <div className="flex flex-wrap items-center gap-2">
            <input aria-label={f.label} className="h-9 rounded-lg border border-line bg-surface px-2 text-[16px]" value={raw} onChange={(e) => setRaw(e.target.value)} />
            <Button size="sm" variant="primary" onClick={save}>Save</Button>
            <Button size="sm" variant="quiet" onClick={() => { setEditing(false); setErr(null); }}>Cancel</Button>
            {err && <p role="alert" className="m-0 w-full text-[12.5px] font-semibold text-danger">{err}</p>}
          </div>
        ) : (
          <>
            <span className="num font-semibold">{displayValue(f)}</span>
            {f.note?.startsWith("computed by code") && <span className="ml-2 rounded bg-raised px-1.5 py-0.5 text-[11px] font-bold text-muted">Computed</span>}
            {f.status !== "ready" && f.note && <p className="m-0 text-[12.5px] text-muted">{f.note}</p>}
            {f.sourceQuote && <details><summary className="cursor-pointer text-[12px] text-muted">Source words</summary><q className="text-[12.5px]">{f.sourceQuote}</q></details>}
          </>
        )}
      </td>
      <td className="py-2 pr-3"><SourceChip source={hidden ? null : f.source} /></td>
      <td className="py-2 pr-3 text-[12.5px]">
        {!hidden && pct !== null ? (
          <div className="inline-flex items-center gap-2">
            <div role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={`Confidence ${pct}%`} className="h-1.5 w-16 overflow-hidden rounded bg-raised">
              <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
            </div>
            <span className="num">{pct}%</span>
          </div>
        ) : "—"}
      </td>
      <td className="py-2 pr-3"><StatusPill status={hidden && f.group === "income" ? "needs_authorization" : f.status} /></td>
      <td className="py-2 text-right">
        {!hidden && onEdit && editable(f, mode) && !editing && (
          <Button size="sm" variant="quiet" aria-label={`Edit ${f.label}`} onClick={() => { setRaw(f.value === null ? "" : String(f.value)); setEditing(true); }}>Edit</Button>
        )}
      </td>
    </tr>
  );
}

export function FieldsTable({ fields, mode, onEdit }: { fields: PrefillField[]; mode: Mode; onEdit?: (key: string, raw: string) => string | null }) {
  return (
    <div className="shrink-0 overflow-x-auto rounded-2xl border border-line bg-surface px-4 py-2">
      <table className="w-full min-w-[640px] border-collapse">
        <caption className="sr-only">Prefilled fields</caption>
        <thead>
          <tr className="text-left text-[11.5px] font-bold uppercase tracking-wide text-muted">
            <th className="py-1 pr-3">Field</th><th className="py-1 pr-3">Value</th><th className="py-1 pr-3">Source</th>
            <th className="py-1 pr-3">Confidence</th><th className="py-1 pr-3">Status</th><th className="py-1"><span className="sr-only">Edit</span></th>
          </tr>
        </thead>
        <tbody>{fields.map((f) => <Row key={f.key} f={f} mode={mode} onEdit={onEdit} />)}</tbody>
      </table>
    </div>
  );
}
