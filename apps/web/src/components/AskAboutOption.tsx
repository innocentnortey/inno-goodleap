// SCR-2: ask a question about one loan option. The server recomputes the figures; this panel sends only
// productId, amount and the question, and shows the guarded answer with its disclosures and checks row.
import { useEffect, useState } from "react";
import { formatPct, formatUsd } from "@goodleap/shared";
import type { GuardedAnswer, GuardrailName, Scenario } from "@goodleap/shared";
import { api, ApiFailure } from "../lib/api";
import { session } from "../state/session";
import { Disclosure } from "./Disclosure";
import { Button, Card, ElapsedTimer, Notice } from "./ui";

interface Qa { question: string; answer: GuardedAnswer }
type TermsState = string | null | "unavailable";

const CHECK_WORD: Record<GuardrailName, string> = { numbers: "numbers", approval_language: "wording", disclosures: "disclosures" };

export function AskAboutOption({ scenario }: { scenario: Scenario }) {
  return <AskPanel key={scenario.id} scenario={scenario} />;
}

function suggestions(s: Scenario): string[] {
  const first =
    s.kind === "deferred" ? `What happens if I don't pay it all off in ${s.promo?.months ?? 18} months?`
    : s.kind === "intro" ? `What happens to the payment after month ${s.phases[0]?.months ?? 12}?`
    : "Can I pay this off early?";
  return [first, "How much interest is in the total?", "Will I qualify for this?"];
}

function Chip({ children }: { children: string }) {
  return <span className="num rounded-md bg-soft px-2 py-1 text-[12.5px] font-bold text-accent">{children}</span>;
}

function AskPanel({ scenario }: { scenario: Scenario }) {
  const [status, setStatus] = useState<"idle" | "thinking" | "error">("idle");
  const [answers, setAnswers] = useState<Qa[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastQuestion, setLastQuestion] = useState("");
  const [input, setInput] = useState("");
  const [terms, setTerms] = useState<TermsState>(null);

  useEffect(() => {
    let live = true;
    api.get<{ productId: string; name: string; terms: string }>(`/terms/${scenario.productId}`)
      .then((r) => { if (live) setTerms(r.terms); })
      .catch(() => { if (live) setTerms("unavailable"); });
    return () => { live = false; };
  }, [scenario.productId]);

  async function submit(q: string) {
    const question = q.trim();
    if (!question) return;
    setStatus("thinking");
    setLastQuestion(question);
    setError(null);
    try {
      const answer = await api.post<GuardedAnswer>("/ask", { productId: scenario.productId, amount: scenario.amount, question });
      setAnswers((a) => [{ question, answer }, ...a].slice(0, 2));
      setInput("");
      setStatus("idle");
      session.set((s) => ({ answers: s.answers + 1 }));
    } catch (e) {
      setError(e instanceof ApiFailure ? e.message : "Something went wrong. Try again.");
      setStatus("error");
    }
  }

  const thinking = status === "thinking";
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex flex-wrap gap-1.5">
          <Chip>{`Est. ${formatUsd(scenario.monthlyPayment)}/mo`}</Chip>
          {scenario.phases.length > 1 && <Chip>{`then ${formatUsd(scenario.phases[1].payment)}/mo`}</Chip>}
          <Chip>{`APR ${formatPct(scenario.aprPct)}`}</Chip>
          <Chip>{`${scenario.termMonths} months`}</Chip>
          <Chip>{`Total of payments ${formatUsd(scenario.totalPaid)}`}</Chip>
          {scenario.promo && <Chip>{`Promo ${scenario.promo.months} months`}</Chip>}
          {scenario.promo && <Chip>{`Retroactive interest ${formatUsd(scenario.promo.retroactiveInterest)}`}</Chip>}
        </div>
        <p className="mb-0 mt-2 text-[12.5px] text-muted">These are the only numbers the answer may use.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions(scenario).map((s) => (
          <Button key={s} size="sm" variant="secondary" disabled={thinking} onClick={() => void submit(s)}>{s}</Button>
        ))}
      </div>

      <form className="flex flex-col gap-1.5" onSubmit={(e) => { e.preventDefault(); void submit(input); }}>
        <label htmlFor="ask-q" className="text-[13px] font-bold">Your question</label>
        <div className="flex gap-2">
          <input id="ask-q" type="text" maxLength={500} value={input} onChange={(e) => setInput(e.target.value)}
            className="h-11 min-w-0 flex-1 rounded-xl border border-[color-mix(in_srgb,var(--accent)_35%,var(--line))] bg-surface px-3 text-[16px] text-text outline-none focus-visible:outline-2 focus-visible:outline-accent" />
          <Button type="submit" variant="primary" size="lg" disabled={!input.trim() || thinking}>Ask</Button>
        </div>
        <ElapsedTimer running={thinking} />
      </form>

      {status === "error" && error && (
        <Notice tone="danger">
          {error} <Button variant="link" size="sm" onClick={() => void submit(lastQuestion)}>Try again</Button>
        </Notice>
      )}

      {answers.map((qa, i) => <AnswerCard key={qa.answer.auditId} qa={qa} terms={terms} previous={i > 0} />)}
    </div>
  );
}

function AnswerCard({ qa, terms, previous }: { qa: Qa; terms: TermsState; previous: boolean }) {
  const { answer } = qa;
  return (
    <Card className={previous ? "opacity-70" : undefined}>
      <div data-answer data-outcome={answer.outcome} role="status" className="flex flex-col gap-2.5">
        {previous && <span className="text-[11.5px] font-bold uppercase tracking-wide text-muted">Previous question</span>}
        <p className="m-0 text-[12.5px] text-muted">{qa.question}</p>
        {answer.outcome === "safe_template" && <span className="w-fit rounded-md bg-checkbg px-2 py-0.5 text-[11.5px] font-bold text-check">Fallback answer</span>}
        {answer.outcome === "redirected" && <span className="w-fit rounded-md bg-raised px-2 py-0.5 text-[11.5px] font-bold text-muted">Outside what this box answers</span>}
        <p className="m-0 text-[15px] leading-relaxed">{answer.text}</p>
        <Disclosure d={answer.disclosures} />
        <details className="text-[13px]">
          <summary className="cursor-pointer font-bold text-accent">See full terms</summary>
          <p className="mb-0 mt-2 text-muted">{terms === "unavailable" ? "Terms are unavailable right now." : terms ?? "Loading terms…"}</p>
        </details>
        <p className="m-0 text-[12px] text-muted">
          <a href={`#/audit?id=${answer.auditId}`} className="underline underline-offset-2">
            {answer.checks.length === 3
              ? `Checked ${answer.checks.map((c) => `${c.passed ? "✓" : "✗"} ${CHECK_WORD[c.name]}`).join(" · ")}`
              : "Answered by a redirect rule · see audit record"}
          </a>
          {` · ${(answer.latencyMs / 1000).toFixed(1)} s`}
        </p>
      </div>
    </Card>
  );
}
