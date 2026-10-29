import type { Priority } from "@goodleap/shared";

const OPTIONS: [Priority, string][] = [["lower_monthly", "Lower monthly payment"], ["lower_total", "Lower total cost"]];

export function PriorityToggle({ value, onChange }: { value: Priority; onChange: (p: Priority) => void }) {
  return (
    <div role="group" aria-label="What matters more" className="inline-flex flex-wrap rounded-xl border border-line bg-raised p-1">
      {OPTIONS.map(([p, label]) => (
        <button key={p} type="button" aria-pressed={value === p} onClick={() => onChange(p)}
          className={`h-9 rounded-lg px-3 text-[13.5px] font-bold ${value === p ? "bg-accent text-onaccent" : "text-text hover:bg-surface"}`}>{label}</button>
      ))}
    </div>
  );
}
