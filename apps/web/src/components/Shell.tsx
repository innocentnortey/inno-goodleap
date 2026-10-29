// App shell pieces: the step rail and the top bar (Riverside direction B, rebranded GoodLeap). Step states are derived
// from the session in ONE place, deriveSteps(), so screens only update the session and the rail follows.
// Owned by Foundation.
import type { MouseEvent, ReactNode } from "react";
import { Check, FileSearch, Moon, RotateCcw, Signpost, Sun } from "lucide-react";
import { go, type Route } from "../router";
import { session, type SessionState } from "../state/session";
import type { ScreenMeta } from "../screens/registry";
import { applyTheme, storedTheme } from "../lib/theme";
import { useState } from "react";

export type StepState = "done" | "now" | "optional" | "todo";
const STEP_WORDS: Record<StepState, string> = { done: "Done", now: "In progress", optional: "Optional", todo: "Not started" };

interface StepView { n: number; name: string; route: Route; state: StepState; current: boolean; who: string }

/** The only place step states are decided. */
export function deriveSteps(s: SessionState, route: Route): StepView[] {
  const incomeDone = s.income?.status === "verified" || s.income?.status === "document_review";
  const rows: Omit<StepView, "current" | "state">[] = [
    { n: 1, name: "Compare options", route: "compare", who: "Contractor + homeowner" },
    { n: 2, name: "Ask about this option", route: "compare", who: "Homeowner" },
    { n: 3, name: "Start application", route: "apply", who: "Contractor" },
    { n: 4, name: "Verify income", route: "verify", who: "Homeowner" },
    { n: 5, name: "Review and submit", route: "review", who: "Homeowner" },
  ];
  const base: Record<number, StepState> = {
    1: s.selected ? "done" : "todo",
    2: s.answers > 0 ? "done" : "optional",
    3: s.prepared ? "done" : "todo",
    4: incomeDone ? "done" : "todo",
    5: s.decision ? "done" : "todo",
  };
  return rows.map((r) => {
    const current = r.n === 2 ? route === "compare" && s.askOpen : r.route === route && !(r.n === 1 && s.askOpen);
    const st = base[r.n];
    return { ...r, current, state: current && st !== "done" ? "now" : st };
  });
}

const nav = (route: Route, then?: () => void) => (e: MouseEvent) => { e.preventDefault(); go(route); then?.(); };

function NavLink({ route, icon, children, current }: { route: Route; icon: ReactNode; children: ReactNode; current?: boolean }) {
  return <a href={`#/${route}`} onClick={nav(route)} aria-current={current ? "page" : undefined} className="railnav">{icon}<span>{children}</span></a>;
}

export function Rail({ screen, s }: { screen: ScreenMeta; s: SessionState }) {
  const steps = deriveSteps(s, screen.route);
  return (
    <aside className="rail" aria-label="Financing steps">
      <div className="brand"><i className="logo" aria-hidden /><b>GoodLeap</b><small>Contractor portal · ABC Roofing LLC</small></div>
      <p className="railh" id="steps-h">Financing steps</p>
      <ol className="steps" aria-labelledby="steps-h">
        {steps.map((st) => (
          <StepRow key={st.n} st={st} s={s} />
        ))}
      </ol>
      <nav className="railfoot" aria-label="For reviewers">
        <p className="railh">For reviewers</p>
        <NavLink route="audit" current={screen.route === "audit"} icon={<FileSearch aria-hidden />}>Compliance audit</NavLink>
        <NavLink route="next" current={screen.route === "next"} icon={<Signpost aria-hidden />}>Where we'd take it next</NavLink>
        <button type="button" className="railnav" onClick={() => { session.reset(); go("compare"); }}><RotateCcw aria-hidden /><span>Start over</span></button>
      </nav>
    </aside>
  );
}

function StepRow({ st, s }: { st: StepView; s: SessionState }) {
  // Step 2 opens the question box over SCR-1, and only once an option is chosen.
  const open = st.n === 2 ? () => { if (s.selected) session.set({ askOpen: true }); } : st.n === 1 ? () => session.set({ askOpen: false }) : undefined;
  return (
    <>
      {st.n === 4 && <li className="raildiv" aria-hidden style={{ display: "flex" }}>Hand to homeowner</li>}
      <li data-state={st.state === "optional" ? "todo" : st.state} data-current={st.current || undefined} aria-current={st.current ? "step" : undefined}>
        <a href={`#/${st.route}`} onClick={nav(st.route, open)}>
          <span className="dot" aria-hidden>{st.state === "done" ? <Check className="size-3.5" strokeWidth={3} /> : st.n}</span>
          <span className="nm">{st.name}</span><span className="stt">{STEP_WORDS[st.state]} · {st.who}</span>
        </a>
      </li>
    </>
  );
}

export function TopBar({ screen }: { screen: ScreenMeta }) {
  const [theme, setTheme] = useState(storedTheme());
  const chip = screen.step ? `Step ${screen.step} of 5` : "For reviewers";
  const toggle = () => { const t = theme === "dark" ? "light" : "dark"; applyTheme(t); setTheme(t); };
  return (
    <header className="top">
      <div className="where">
        <span className="stepchip">{chip}</span>
        <h1 tabIndex={-1} data-topfocus>{screen.title}</h1>
      </div>
      <span className="demotag ml-auto">Concept prototype · synthetic data</span>
      <span className="saved max-lg:hidden">{screen.who}</span>
      <button type="button" className="ghost" onClick={toggle} aria-label={theme === "dark" ? "Use light theme" : "Use dark theme"}>
        {theme === "dark" ? <Sun aria-hidden className="size-4" /> : <Moon aria-hidden className="size-4" />}
      </button>
    </header>
  );
}
