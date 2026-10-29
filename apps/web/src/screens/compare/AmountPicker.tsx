import { formatUsd0 } from "@goodleap/shared";
import { Button, Field } from "../../components/ui";

/** "" → null; "$30,000" → 30000; anything else that is not a number → NaN. */
export function parseAmount(text: string): number | null {
  const t = text.replace(/[$,\s]/g, "");
  if (t === "") return null;
  return /^\d*\.?\d+$|^\d+\.$/.test(t) ? Number(t) : NaN;
}

const CHIPS: [string, number][] = [["$15K", 15000], ["$30K", 30000], ["$45K", 45000]];

export function AmountPicker({ text, onText, error, range }: { text: string; onText: (t: string) => void; error?: string; range?: { min: number; max: number } }) {
  const current = parseAmount(text);
  const hint = range ? `The amount to finance, ${formatUsd0(range.min)} to ${formatUsd0(range.max)}.` : "The amount to finance.";
  return (
    <div className="flex flex-col gap-2">
      <Field id="amount" label="Project amount" hint={hint} inputMode="decimal" autoComplete="off" value={text} onChange={(e) => onText(e.target.value)} error={error} />
      <div role="group" aria-label="Quick amounts" className="flex gap-2">
        {CHIPS.map(([label, v]) => (
          <Button key={label} size="sm" variant="secondary" aria-pressed={current === v} className={current === v ? "border-accent text-accent" : undefined} onClick={() => onText(v.toLocaleString("en-US"))}>{label}</Button>
        ))}
      </div>
    </div>
  );
}
