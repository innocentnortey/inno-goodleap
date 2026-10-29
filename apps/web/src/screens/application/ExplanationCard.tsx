// Plain-words explanation of a failed income check (SCR-4). Text is guarded server-side; disclosures come from code.
import type { GuardedAnswer } from "@goodleap/shared";
import { Card } from "../../components/ui";
import { Disclosure } from "../../components/Disclosure";

export function ExplanationCard({ answer }: { answer: GuardedAnswer }) {
  return (
    <Card>
      <p className="m-0 text-[12px] font-bold uppercase tracking-wide text-muted">What happened, in plain words</p>
      <p className="my-2 text-[14.5px] leading-relaxed">{answer.text}</p>
      <Disclosure d={answer.disclosures} className="mt-2" />
    </Card>
  );
}
