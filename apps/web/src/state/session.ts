// The demo's one client-side store: what each screen hands to the next (amount → chosen scenario → prepared
// application → income → decision). Kept in sessionStorage so a reload keeps the journey. Screens call session.set();
// the rail and the summary follow. Owned by Foundation; a segment that needs a new key asks the orchestrator.
import { useSyncExternalStore } from "react";
import type { CreditDecision, IncomeVerificationResult, PrefillField, PreparedApplication, Priority, QuoteResponse, Scenario } from "@goodleap/shared";

export interface SessionState {
  amount: number;
  priority: Priority;
  quote: QuoteResponse | null;
  /** The option chosen on SCR-1 (or the one being asked about). */
  selected: Scenario | null;
  /** SCR-2 panel open (the shell renders it over SCR-1). */
  askOpen: boolean;
  /** Answers shown on SCR-2 this session (step 2's state). */
  answers: number;
  contractorId: string;
  estimateId: string | null;
  prepared: PreparedApplication | null;
  /** The working application: prepared fields, then income fields, with homeowner edits applied. */
  fields: PrefillField[];
  income: IncomeVerificationResult | null;
  decision: CreditDecision | null;
}

export const INITIAL: SessionState = {
  amount: 30000, priority: "lower_monthly", quote: null, selected: null, askOpen: false, answers: 0,
  contractorId: "C-1001", estimateId: null, prepared: null, fields: [], income: null, decision: null,
};

const KEY = "goodleap-demo-session-v2";
function load(): SessionState {
  try { const raw = sessionStorage.getItem(KEY); if (raw) return { ...INITIAL, ...JSON.parse(raw), askOpen: false }; } catch { /* private mode: start fresh */ }
  return INITIAL;
}

let state = load();
const listeners = new Set<() => void>();

export const session = {
  get: () => state,
  set(patch: Partial<SessionState> | ((s: SessionState) => Partial<SessionState>)) {
    const next = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
    // A different chosen scenario (another option, or a new amount) invalidates everything prepared for the old one,
    // so an application can never mix one option's product with another's fields, income or decision.
    if (state.selected && next.selected?.id !== state.selected.id) Object.assign(next, { prepared: null, fields: [], income: null, decision: null, estimateId: null });
    state = next;
    try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
    listeners.forEach((l) => l());
  },
  reset() { session.set(INITIAL); },
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
};

export function useSession(): SessionState {
  return useSyncExternalStore(session.subscribe, session.get);
}

/** Replace fields by key (adds new keys at the end). Income and homeowner edits go through this. */
export function mergeFields(current: PrefillField[], updates: PrefillField[]): PrefillField[] {
  const byKey = new Map(updates.map((f) => [f.key, f]));
  const merged = current.map((f) => byKey.get(f.key) ?? f);
  const known = new Set(current.map((f) => f.key));
  return [...merged, ...updates.filter((f) => !known.has(f.key))];
}
