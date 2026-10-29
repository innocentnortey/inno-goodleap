// SCR-7 building blocks (segment D). Semantic tokens only; composes the Foundation primitives.
import type { ReactNode } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";
import type { RoadmapItem, RoadmapSource } from "@goodleap/shared";
import { Card, cx } from "../../components/ui";

/** Screen id → where it lives in the demo. SCR-2 is the panel on the Compare screen. */
const SCREEN_LINK: Record<string, { href: string; name: string }> = {
  "SCR-1": { href: "#/compare", name: "Compare options" },
  "SCR-2": { href: "#/compare", name: "Ask about this option" },
  "SCR-3": { href: "#/apply", name: "Start application" },
  "SCR-4": { href: "#/verify", name: "Verify income" },
  "SCR-5": { href: "#/review", name: "Review and submit" },
  "SCR-6": { href: "#/audit", name: "Compliance audit" },
};

export function ScreenLinks({ screens }: { screens: string }) {
  const ids = screens.match(/SCR-\d+/g) ?? [];
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {ids.map((id) => {
        const target = SCREEN_LINK[id];
        if (!target) return <span key={id} className="text-[13px] font-bold">{id}</span>;
        return (
          <a key={id} href={target.href} className="inline-flex items-center gap-1 text-[13px] font-bold text-accent underline-offset-4 hover:underline">
            {id} · {target.name}<ArrowRight aria-hidden className="size-3.5" />
          </a>
        );
      })}
    </span>
  );
}

const STATUS_TAG: Record<RoadmapSource["status"], [string, string]> = {
  verified: ["Verified", "bg-[color-mix(in_srgb,var(--office)_12%,transparent)] text-office"],
  partly_verified: ["Partly verified", "bg-soft text-accent"],
  not_found: ["Not found", "bg-raised text-muted ring-[1.5px] ring-line"],
  assumption: ["Assumption", "bg-checkbg text-check ring-[1.5px] ring-[color-mix(in_srgb,var(--check)_60%,transparent)]"],
};

export function StatusTag({ status }: { status: RoadmapSource["status"] }) {
  const [word, cls] = STATUS_TAG[status];
  return <span data-status={status} className={cx("inline-flex whitespace-nowrap rounded-md px-2 py-0.5 text-[11.5px] font-bold", cls)}>{word}</span>;
}

export function SourceLine({ source }: { source: RoadmapSource }) {
  return (
    <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted">
      <StatusTag status={source.status} />
      {source.url ? (
        <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-1 break-words text-accent underline underline-offset-4">
          {source.label}<ExternalLink aria-hidden className="size-3 flex-none" />
        </a>
      ) : (
        <span>{source.label}</span>
      )}
      {source.read && <span>· read {source.read}</span>}
    </p>
  );
}

export function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div>
        <h2 id={id} className="text-[17px] font-extrabold">{title}</h2>
        {intro && <p className="m-0 mt-1 max-w-[70ch] text-pretty text-[13.5px] text-muted">{intro}</p>}
      </div>
      {children}
    </section>
  );
}

export function RoadmapCard({ item }: { item: RoadmapItem }) {
  const rows: [string, string][] = [["Friction point", item.friction], ["Metric", item.metric], ["Why it waited", item.whyItWaited]];
  return (
    <Card className="flex flex-col gap-2.5">
      <h4 className="text-[14.5px] font-extrabold">{item.title}</h4>
      <dl className="m-0 flex flex-col gap-2">
        {rows.map(([term, text]) => (
          <div key={term}>
            <dt className="text-[11.5px] font-bold uppercase tracking-[.06em] text-muted">{term}</dt>
            <dd className="m-0 text-pretty text-[13.5px]">{text}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
