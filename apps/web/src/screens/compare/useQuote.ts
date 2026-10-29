// SCR-1 data hook: debounced POST /quote with stale-response protection. The server owns every number.
import { useEffect, useState, useSyncExternalStore } from "react";
import type { Priority, QuoteResponse } from "@goodleap/shared";
import { api, ApiFailure } from "../../lib/api";
import { session } from "../../state/session";

export type QuoteStatus = "empty" | "loading" | "ready" | "amount_error" | "server_error";

const AMOUNT_CODES = ["amount_below_min", "amount_above_max", "invalid_amount"];

export function useQuote(amount: number | null, priority: Priority): { status: QuoteStatus; error: string | null; retry: () => void } {
  const [status, setStatus] = useState<QuoteStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  // Re-run when the stored quote disappears (rail "Start over" resets the session while this screen stays mounted).
  const hasQuote = useSyncExternalStore(session.subscribe, () => session.get().quote !== null);

  useEffect(() => {
    if (amount === null) { setStatus("empty"); setError(null); return; }
    const have = session.get().quote;
    if (nonce === 0 && have && have.amount === amount && have.priority === priority) { setStatus("ready"); setError(null); return; }
    setStatus("loading");
    let stale = false; // set by cleanup: a newer request or unmount supersedes this one
    const timer = setTimeout(() => {
      api.post<QuoteResponse>("/quote", { amount, priority }).then(
        (res) => {
          if (stale) return;
          session.set((s) => ({
            amount, priority, quote: res,
            selected: s.selected ? res.scenarios.find((x) => x.productId === s.selected!.productId) ?? null : null,
          }));
          setError(null);
          setStatus("ready");
        },
        (e: unknown) => {
          if (stale) return;
          const msg = e instanceof Error ? e.message : "Something went wrong.";
          if (e instanceof ApiFailure && e.status === 400 && AMOUNT_CODES.includes(e.code)) {
            session.set({ quote: null, selected: null });
            setError(msg);
            setStatus("amount_error");
          } else {
            setError(msg);
            setStatus("server_error");
          }
        },
      );
    }, 300);
    return () => { stale = true; clearTimeout(timer); };
  }, [amount, priority, nonce, hasQuote]);

  return { status, error, retry: () => setNonce((n) => n + 1) };
}
