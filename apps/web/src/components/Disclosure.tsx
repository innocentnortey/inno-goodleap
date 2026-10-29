// The one disclosure component (PRD C-2): small, muted, never behind a tooltip. Its content comes from code
// (Scenario.disclosures or GuardedAnswer.disclosures), never from model text. Owned by Foundation.
import { formatPct, formatUsd, RESPA_LINE, type Disclosures } from "@goodleap/shared";
import { cx } from "./ui";

export function Disclosure({ d, full, className }: { d: Disclosures; full?: boolean; className?: string }) {
  const figures = [
    d.aprPct !== undefined && `APR ${formatPct(d.aprPct)}`,
    d.termMonths !== undefined && `Term ${d.termMonths} months`,
    d.totalCostOfCredit !== undefined && `Total cost of credit ${formatUsd(d.totalCostOfCredit)}`,
    d.totalPaid !== undefined && `Total of payments ${formatUsd(d.totalPaid)}`,
  ].filter(Boolean) as string[];
  const lines = full && !d.lines.includes(RESPA_LINE) ? [...d.lines, RESPA_LINE] : d.lines;
  return (
    <div data-disclosure className={cx("rounded-xl border border-line bg-raised px-3 py-2 text-[12px] leading-[1.45] text-muted", className)}>
      <p className="m-0 font-semibold text-text">{d.estimateLine}</p>
      {figures.length > 0 && <p className="num m-0">{figures.join(" · ")}</p>}
      {lines.map((l) => <p key={l} className="m-0">{l}</p>)}
    </div>
  );
}
