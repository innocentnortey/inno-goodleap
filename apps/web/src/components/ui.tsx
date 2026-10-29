// Owned primitives, adapted from Riverside direction B (inno-riverside-onboarding apps/web/src/components/ui.tsx).
// Semantic tokens only. Owned by Foundation; segments compose these and never restyle them.
import { forwardRef, useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { AlertTriangle, Check, Loader2, Lock, Minus, X } from "lucide-react";
import type { FieldSource, FieldStatus } from "@goodleap/shared";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type Variant = "primary" | "secondary" | "quiet" | "link" | "danger";
const VARIANT: Record<Variant, string> = {
  primary: "bg-accent text-onaccent border border-accent shadow-[0_12px_26px_-12px_color-mix(in_srgb,var(--accent)_80%,transparent)] hover:brightness-110",
  secondary: "bg-surface text-text border border-line hover:bg-raised",
  quiet: "bg-transparent text-muted border border-transparent hover:bg-raised hover:text-text",
  link: "bg-transparent text-accent border border-transparent underline underline-offset-4 hover:bg-raised",
  danger: "bg-surface text-danger border border-line hover:bg-raised",
};
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; size?: "sm" | "md" | "lg"; loading?: boolean }
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = "secondary", size = "md", loading, disabled, className, children, type = "button", ...rest }, ref) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} aria-busy={loading || undefined}
      className={cx("inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-[background,color,filter] duration-150 motion-reduce:transition-none disabled:opacity-55 disabled:cursor-not-allowed",
        size === "lg" ? "h-12 px-5 text-[15px]" : size === "sm" ? "h-8 px-3 text-[12.5px]" : "h-10 px-4 text-[13.5px]", VARIANT[variant], className)} {...rest}>
      {loading && <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />}
      {children}
    </button>
  );
});

/** Where a prefilled value came from. Words, never colour alone. */
const SOURCE_WORD: Record<FieldSource, string> = {
  estimate: "From estimate", profile: "Contractor profile", conversation: "Chosen on screen", homeowner: "Homeowner entered",
  plaid: "Bank (Plaid)", document: "Pay stub",
};
export function SourceChip({ source }: { source: FieldSource | null }) {
  if (!source) return <span className="inline-flex whitespace-nowrap rounded-md bg-raised px-2 py-0.5 text-[11.5px] font-bold text-muted">No source yet</span>;
  return <span data-source={source} className="inline-flex whitespace-nowrap rounded-md bg-soft px-2 py-0.5 text-[11.5px] font-bold text-accent">{SOURCE_WORD[source]}</span>;
}

const STATUS: Record<FieldStatus, [string, string, ReactNode]> = {
  ready: ["Ready", "bg-[color-mix(in_srgb,var(--office)_12%,transparent)] text-office", <Check key="i" className="size-3" />],
  needs_review: ["Needs review", "bg-checkbg text-check", <AlertTriangle key="i" className="size-3" />],
  needs_input: ["Needs input", "bg-raised text-text ring-[1.5px] ring-line", <Minus key="i" className="size-3" />],
  needs_authorization: ["Needs homeowner", "bg-soft text-accent", <Lock key="i" className="size-3" />],
};
export function StatusPill({ status }: { status: FieldStatus }) {
  const [word, cls, icon] = STATUS[status];
  return <span data-status={status} className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-[11.5px] font-bold", cls)}>{icon}{word}</span>;
}

/** Column header band (at least 66px). `focus` marks the heading the shell focuses on arrival. */
export function ColumnHeader({ title, sub, aside, focus }: { title: string; sub?: string; aside?: ReactNode; focus?: boolean }) {
  return (
    <div className="colh flex min-h-[66px] flex-none items-center gap-3 border-b border-line px-6 py-2">
      <div className="min-w-0">
        <h2 tabIndex={focus ? -1 : undefined} data-focus={focus || undefined} className="text-[15.5px] font-extrabold">{title}</h2>
        {sub && <p className="colh-sub m-0 text-pretty text-[12.5px] leading-[1.35] text-muted">{sub}</p>}
      </div>
      {aside && <div className="ml-auto flex items-center gap-2">{aside}</div>}
    </div>
  );
}

/** Centre = the task; right = the running summary + the screen's one primary action. Below lg the action becomes a
 *  fixed bottom bar so the primary action is always reachable (SCREEN_SPECS phone layout); screens add no bar of their own. */
export function TaskLayout({ title, sub, aside, centre, right, rightTitle, action }: {
  title: string; sub?: string; aside?: ReactNode; centre: ReactNode; right: ReactNode; rightTitle: string; action?: ReactNode;
}) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_clamp(300px,24vw,350px)] lg:grid-rows-[minmax(0,1fr)]">
      <div className="flex min-h-0 flex-col">
        <ColumnHeader title={title} sub={sub} aside={aside} focus />
        <CentreBody className={action ? "max-lg:pb-28" : undefined}>{centre}</CentreBody>
      </div>
      <aside className="flex min-h-0 flex-col border-t border-line bg-surface lg:border-t-0 lg:border-l" aria-label={rightTitle}>
        <ColumnHeader title={rightTitle} />
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-[18px]">{right}</div>
        {action && <div className="flex flex-none flex-col gap-2 border-t border-line bg-surface px-4 pb-4 pt-3.5 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-40 max-lg:shadow-[var(--compshadow)]">{action}</div>}
      </aside>
    </div>
  );
}

export function CentreBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("flex min-h-0 flex-1 flex-col gap-[18px] overflow-auto px-7 py-[22px] max-sm:px-4", className)}>{children}</div>;
}

/** Single-column screen (Audit, Roadmap). */
export function PageLayout({ title, sub, aside, children }: { title: string; sub?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ColumnHeader title={title} sub={sub} aside={aside} focus />
      <CentreBody>{children}</CentreBody>
    </div>
  );
}

/** Text input with a visible label. 16px input text. */
export function Field({ label, hint, error, id, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string; id: string }) {
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-bold">{label}</label>
      {hint && <p id={`${id}-hint`} className="m-0 text-[12.5px] text-muted">{hint}</p>}
      <input id={id} aria-invalid={error ? true : undefined} aria-describedby={[hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(" ") || undefined}
        className={cx("h-11 rounded-xl border bg-surface px-3 text-[16px] text-text outline-none focus-visible:outline-2 focus-visible:outline-accent", error ? "border-danger" : "border-[color-mix(in_srgb,var(--accent)_35%,var(--line))]")} {...rest} />
      {error && <p id={`${id}-err`} role="alert" className="m-0 text-[13px] font-semibold text-danger">{error}</p>}
    </div>
  );
}

/** Notice box: lavender for information, amber for "please check", red ring for errors. */
export function Notice({ tone = "info", children, icon, className }: { tone?: "info" | "check" | "office" | "danger"; children: ReactNode; icon?: ReactNode; className?: string }) {
  const tones = { info: "g-lavender", check: "bg-checkbg text-check ring-[1.5px] ring-[color-mix(in_srgb,var(--check)_60%,transparent)]", office: "border border-dashed border-office text-office", danger: "bg-surface text-danger ring-[1.5px] ring-danger" };
  return <div role={tone === "danger" ? "alert" : "status"} className={cx("flex items-start gap-3 rounded-2xl px-3.5 py-3 text-[14px]", tones[tone], className)}>{icon}<div className="min-w-0 flex-1">{children}</div></div>;
}

export function Card({ children, className, selected }: { children: ReactNode; className?: string; selected?: boolean }) {
  return <div className={cx("rounded-2xl border bg-surface p-4", selected ? "border-accent ring-2 ring-[color-mix(in_srgb,var(--accent)_30%,transparent)]" : "border-line", className)}>{children}</div>;
}

/** Grey block for loading states. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx("animate-pulse rounded-xl bg-raised motion-reduce:animate-none", className)} />;
}

/** Elapsed-seconds counter shown while a model call runs (PRD §10: the reviewer sees the latency). */
export function ElapsedTimer({ running, label = "Thinking" }: { running: boolean; label?: string }) {
  const [ms, setMs] = useState(0);
  const start = useRef(0);
  useEffect(() => {
    if (!running) return;
    start.current = performance.now();
    setMs(0);
    const t = setInterval(() => setMs(performance.now() - start.current), 100);
    return () => clearInterval(t);
  }, [running]);
  if (!running) return null;
  return <span role="status" className="num inline-flex items-center gap-2 text-[13px] font-semibold text-muted"><Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />{label} · {(ms / 1000).toFixed(1)} s</span>;
}

/** Right-hand slide-over panel (SCR-2). Escape and the close button call onClose. */
export function SlideOver({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("[data-focus]")?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="slideover" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section ref={ref} role="dialog" aria-modal="true" aria-label={title}>
        <ColumnHeader title={title} focus aside={<Button variant="quiet" size="sm" onClick={onClose} aria-label="Close"><X aria-hidden className="size-4" /></Button>} />
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-5">{children}</div>
      </section>
    </div>
  );
}
