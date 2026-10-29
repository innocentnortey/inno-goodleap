// SCR-1 Compare options (segment A). Every number shown is a Scenario field computed on the server.
import { useState } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button, Notice, TaskLayout } from "../components/ui";
import { FinancingSummary } from "../components/Summary";
import { go } from "../router";
import { session, useSession } from "../state/session";
import { AmountPicker, parseAmount } from "./compare/AmountPicker";
import { OptionCard, OptionCardSkeleton } from "./compare/OptionCard";
import { PriorityToggle } from "./compare/PriorityToggle";
import { useQuote } from "./compare/useQuote";

const TAIL = "The deferred-interest option is listed last because its cost depends on paying it off in time.";

export default function Compare() {
  const s = useSession();
  const [text, setText] = useState(() => session.get().amount.toLocaleString("en-US"));
  const [showAll, setShowAll] = useState(false);
  const parsed = parseAmount(text);
  const notNumber = Number.isNaN(parsed);
  const { status, error, retry } = useQuote(notNumber ? null : parsed, s.priority);

  const list = [...(s.quote?.scenarios ?? [])].sort((a, b) => a.rank - b.rank);
  const shown = showAll ? list : list.slice(0, 3);
  const fieldError = notNumber ? "Enter the amount as a number, for example 30,000." : status === "amount_error" ? error ?? undefined : undefined;
  const hasCards = list.length > 0 && status !== "amount_error" && status !== "empty" && status !== "server_error";

  return (
    <TaskLayout
      title="Compare options"
      sub="Estimated payments for each loan option. Not an offer of credit."
      rightTitle="Financing summary"
      right={<FinancingSummary s={s} />}
      action={
        <>
          <Button variant="primary" size="lg" disabled={!s.selected} aria-describedby="start-help" onClick={() => go("apply")}>Start application</Button>
          <p id="start-help" className="m-0 text-[12.5px] text-muted">
            {s.selected ? `Carries the ${s.selected.productName} estimate into the application.` : "Choose an option to start the application."}
          </p>
        </>
      }
      centre={
        <div className="flex flex-col gap-4">
          <AmountPicker text={text} onText={setText} error={fieldError} range={s.quote?.amountRange} />
          <div><PriorityToggle value={s.priority} onChange={(p) => session.set({ priority: p })} /></div>
          {status === "empty" && !notNumber && <Notice>Enter the project amount to see estimated payments.</Notice>}
          {status === "server_error" && (
            <Notice tone="danger" icon={<AlertTriangle aria-hidden className="size-4" />}>
              <span>Couldn't load the estimates. {error}</span>{" "}
              <Button size="sm" onClick={retry}><RotateCw aria-hidden className="size-4" />Try again</Button>
            </Notice>
          )}
          {status === "loading" && list.length === 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"><OptionCardSkeleton /><OptionCardSkeleton /><OptionCardSkeleton /></div>
          )}
          {hasCards && (
            <div aria-busy={status === "loading"} className={status === "loading" ? "opacity-60" : undefined}>
              <p className="m-0 mb-3 text-[12.5px] text-muted">
                {s.priority === "lower_monthly" ? "Ranked by the highest regular monthly payment. " : "Ranked by estimated total paid. "}{TAIL}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {shown.map((sc) => (
                  <OptionCard key={sc.id} s={sc} selected={s.selected?.id === sc.id} busy={status === "loading"}
                    onChoose={() => session.set({ selected: sc })}
                    onAsk={() => session.set({ selected: sc, askOpen: true })} />
                ))}
              </div>
              {list.length > 3 && (
                <div className="mt-3">
                  <Button variant="link" size="sm" aria-expanded={showAll} onClick={() => setShowAll((v) => !v)}>
                    {showAll ? "Show top 3" : `Show all ${list.length}`}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      }
    />
  );
}
