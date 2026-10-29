import type { AuditRecord } from "@goodleap/shared";
import { Disclosure } from "../../components/Disclosure";
import { Card } from "../../components/ui";
import { CHECK_WORD, OUTCOME_WORD } from "./words";

function H({ children }: { children: string }) {
  return <h3 className="m-0 text-[13px] font-extrabold uppercase tracking-wide text-muted">{children}</h3>;
}

export function AuditDetail({ record }: { record: AuditRecord }) {
  const input = record.inputs.question ?? record.inputs.event ?? "";
  return (
    <Card className="flex flex-col gap-5">
      <div data-audit-detail className="flex flex-col gap-5">
        <section className="flex flex-col gap-2">
          <H>Inputs</H>
          <p className="m-0 text-[14px]"><strong>{record.inputs.question !== undefined ? "Question" : "Event"}:</strong> {input}</p>
          <div className="flex flex-wrap gap-1.5" aria-label="Allowed numbers">
            {record.inputs.allowedNumbers.length === 0 && <span className="text-[12.5px] text-muted">No numbers allowed for this message.</span>}
            {record.inputs.allowedNumbers.map((n) => <span key={n} className="num rounded-md bg-raised px-2 py-0.5 text-[12.5px] font-bold">{String(n)}</span>)}
          </div>
          <Disclosure d={record.inputs.disclosures} full />
        </section>

        <section className="flex flex-col gap-2">
          <H>What the model wrote vs what was shown</H>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-3">
              {record.rawOutput.length === 0 && <p className="m-0 text-[13px] text-muted">No model call: a redirect rule answered.</p>}
              {record.rawOutput.map((raw, i) => (
                <div key={i} className="rounded-xl border border-line p-3">
                  <p className="m-0 mb-1 text-[12px] font-bold text-muted">{raw.startsWith("[model") ? "System note" : "Raw output"} · attempt {i + 1}</p>
                  <p className="m-0 whitespace-pre-wrap text-[13.5px]">{raw}</p>
                  <ul className="mb-0 mt-2 list-none p-0 text-[12.5px]">
                    {(record.checks[i] ?? []).length === 0 && <li className="text-muted">No checks run (refusal, empty or cut-off reply, off-topic or call failure)</li>}
                    {(record.checks[i] ?? []).map((c) => (
                      <li key={c.name}><span className={c.passed ? "text-office" : "text-danger"}>{c.passed ? "✓" : "✗"}</span> <strong>{CHECK_WORD[c.name]}</strong>: {c.detail}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-line bg-soft p-3">
              <p className="m-0 mb-1 text-[12px] font-bold text-muted">Final text shown</p>
              <p className="m-0 text-[14px]">{record.finalText}</p>
              <p className="mb-0 mt-2 text-[12.5px] text-muted">{OUTCOME_WORD[record.outcome]} · {record.attempts} model {record.attempts === 1 ? "call" : "calls"}</p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-1">
          <H>Versions</H>
          <p className="num m-0 text-[12.5px] text-muted">
            model {record.model} · prompt {record.promptVersion} · catalog {record.catalogVersion ?? "—"} · record {record.id} · {record.time} · {record.latencyMs} ms
          </p>
        </section>
      </div>
    </Card>
  );
}
