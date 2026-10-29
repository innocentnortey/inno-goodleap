import { AlertTriangle, Check } from "lucide-react";
import { formatPct, formatUsd, type Scenario } from "@goodleap/shared";
import { Button, Card, Skeleton } from "../../components/ui";
import { Disclosure } from "../../components/Disclosure";

const NOTE = "m-0 flex items-start gap-1.5 rounded-lg bg-checkbg px-2.5 py-1.5 text-[12.5px] font-bold text-check";

function termLine(s: Scenario): string {
  if (s.kind === "intro") return s.phases.map((p) => `${formatUsd(p.payment)} × ${p.months}`).join(", then ");
  if (s.kind === "deferred") return `for ${s.phases[0].months} months to pay it off in the promo`;
  return `for ${s.termMonths} months`;
}

export function OptionCard({ s, selected, busy, onAsk, onChoose }: { s: Scenario; selected: boolean; busy?: boolean; onAsk: () => void; onChoose: () => void }) {
  const cleared = s.kind === "deferred" ? " if cleared" : "";
  const apr = s.kind === "intro" ? `0.00% for ${s.phases[0].months} months, then ${formatPct(s.aprPct)}` : formatPct(s.aprPct);
  return (
    <article data-scenario={s.productId} aria-labelledby={`opt-${s.productId}`} className="flex">
      <Card selected={selected} className="flex w-full flex-col gap-3">
        <h3 id={`opt-${s.productId}`} className="m-0 text-[15px] font-extrabold">{s.productName}</h3>
        <div>
          <p className="m-0 text-[12px] font-bold uppercase tracking-wide text-muted">Estimated payment</p>
          <p className="num m-0 text-[28px] font-extrabold leading-none">{formatUsd(s.monthlyPayment)}<span className="text-[14px] font-bold text-muted">/mo</span>
            {s.kind === "intro" && s.phases[1] && <span className="text-[20px]"> then {formatUsd(s.phases[1].payment)}<span className="text-[14px] font-bold text-muted">/mo</span></span>}
          </p>
          <p className="num m-0 mt-1 text-[13px] text-muted">{termLine(s)}</p>
        </div>
        <dl className="num m-0 grid grid-cols-2 gap-x-3 gap-y-1 text-[13px]">
          <dt className="text-muted">APR</dt><dd className="m-0">{apr}</dd>
          <dt className="text-muted">Total paid</dt><dd className="m-0">{formatUsd(s.totalPaid)}{cleared}</dd>
          <dt className="text-muted">Total interest</dt><dd className="m-0">{formatUsd(s.totalInterest)}{cleared}</dd>
        </dl>
        {s.kind !== "fixed" && s.note && <p className={NOTE}><AlertTriangle aria-hidden className="mt-0.5 size-3.5 flex-none" />{s.note}</p>}
        {s.kind === "deferred" && s.promo && (
          <p className={NOTE}><AlertTriangle aria-hidden className="mt-0.5 size-3.5 flex-none" />{`If not paid off in ${s.promo.months} months: about ${formatUsd(s.promo.retroactiveInterest)} interest added.`}</p>
        )}
        {s.kind === "fixed" && s.note && <p className="m-0 text-[12.5px] font-semibold text-muted">{s.note}</p>}
        <Disclosure d={s.disclosures} />
        <div className="mt-auto flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" disabled={busy} onClick={onAsk}>Ask about this option</Button>
          <Button variant={selected ? "primary" : "secondary"} size="sm" aria-pressed={selected} disabled={busy} onClick={onChoose}>
            {selected && <Check aria-hidden className="size-4" />}Choose this option
          </Button>
        </div>
      </Card>
    </article>
  );
}

export function OptionCardSkeleton() {
  return <Card><Skeleton className="h-5 w-32" /><Skeleton className="mt-3 h-8 w-24" /><Skeleton className="mt-3 h-24" /><Skeleton className="mt-3 h-16" /></Card>;
}
