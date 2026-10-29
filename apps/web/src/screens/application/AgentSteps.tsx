// Collapsed "Agent steps" list (R-8): the tools the assistant called, in the order it chose.
import type { PreparedApplication } from "@goodleap/shared";

export function AgentSteps({ prepared }: { prepared: PreparedApplication }) {
  return (
    <details className="shrink-0 rounded-2xl border border-line bg-surface px-4 py-3">
      <summary className="cursor-pointer text-[13.5px] font-bold">
        Agent steps ({prepared.agentSteps.length}) · {(prepared.latencyMs / 1000).toFixed(1)} s · {prepared.model}
      </summary>
      <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5 text-[13px]">
        {prepared.agentSteps.map((s) => (
          <li key={s.n}><code className="font-mono text-[12.5px]">{s.tool}</code> — {s.summary} · <span className="num">{s.ms} ms</span></li>
        ))}
      </ol>
      <p className="mb-0 mt-2 text-[12.5px] text-muted">The assistant chose the order of these steps; code checked every result and built the fields.</p>
    </details>
  );
}
