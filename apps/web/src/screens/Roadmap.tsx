// SCR-7 · Where we'd take it next (segment D). Static content from data/synthetic/roadmap.json; no server route.
import type { Roadmap as RoadmapData } from "@goodleap/shared";
import roadmapJson from "../../../../data/synthetic/roadmap.json";
import { Card, Notice, PageLayout } from "../components/ui";
import { RoadmapCard, ScreenLinks, Section, SourceLine } from "./roadmap/parts";

const roadmap = roadmapJson as RoadmapData;

export default function Roadmap() {
  const { baseline, demoChanges, horizons, assumptions, notBuilt } = roadmap;
  return (
    <PageLayout title="Where we'd take it next" sub="SCR-7 · for the reviewer · the starting point, what changed and what comes next">
      <div className="mx-auto flex w-full max-w-[920px] flex-col gap-8">
        <Notice tone="info">
          <p className="m-0">
            Public sources were read on 2026-10-29. Each line below names its source and how well it is confirmed; anything
            not confirmed is labelled <b>Assumption</b>. Business figures come from the brief; the 25–50 contractor pilot size is our proposal.
          </p>
        </Notice>

        <Section id="scr7-started" title="Where it started" intro="What public sources show about GoodLeap's contractor financing before this demo. These describe GoodLeap's real products, not the brief's scenario.">
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {baseline.map((line) => (
              <li key={line.claim} data-status={line.source.status}
                className={line.source.status === "assumption" ? "rounded-2xl border border-dashed border-check bg-checkbg/40 p-3.5" : "rounded-2xl border border-line bg-surface p-3.5"}>
                <p className="m-0 mb-1.5 text-pretty text-[14px]">{line.claim}</p>
                <SourceLine source={line.source} />
              </li>
            ))}
          </ul>
        </Section>

        <Section id="scr7-changes" title="What this demo changes" intro="Each friction point the brief names, and the screen that addresses it.">
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {demoChanges.map((row) => (
              <li key={row.friction}>
                <Card className="flex flex-col gap-1.5">
                  <p className="m-0 text-pretty text-[14px] font-bold">{row.friction}</p>
                  <p className="m-0 text-pretty text-[13.5px] text-muted">{row.how}</p>
                  <ScreenLinks screens={row.screen} />
                </Card>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="scr7-next" title="Where we'd go next" intro="Each item names the friction point it addresses, the metric it should move and why it waited. Targets appear only where the brief gives one.">
          <div className="flex flex-col gap-5">
            {horizons.map((h) => (
              <div key={h.name} className="flex flex-col gap-2.5">
                <h3 className="text-[13px] font-bold uppercase tracking-[.08em] text-accent">{h.name}</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {h.items.map((item) => <RoadmapCard key={item.title} item={item} />)}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="scr7-assumptions" title="Assumptions we made" intro="Stated in the README as well.">
          <ol className="m-0 flex flex-col gap-1.5 pl-5 text-[14px]">
            {assumptions.map((a) => <li key={a} className="text-pretty"><span className="mr-1.5 rounded-md bg-checkbg px-1.5 py-0.5 text-[11.5px] font-bold text-check">Assumption</span>{a}</li>)}
          </ol>
        </Section>

        <Section id="scr7-not-built" title="What we deliberately didn't build">
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {notBuilt.map((n) => (
              <li key={n.item} className="rounded-2xl border border-line bg-surface p-3.5">
                <p className="m-0 text-[14px] font-bold">{n.item}</p>
                <p className="m-0 text-pretty text-[13.5px] text-muted">{n.why}</p>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </PageLayout>
  );
}

