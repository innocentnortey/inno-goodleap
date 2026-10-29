// Tiny hash router: #/compare. Owned by Foundation.
import { useSyncExternalStore } from "react";

export type Route = "compare" | "apply" | "verify" | "review" | "audit" | "next";
const ROUTES: Route[] = ["compare", "apply", "verify", "review", "audit", "next"];

const read = (): Route => {
  const r = window.location.hash.replace(/^#\/?/, "").split("?")[0] as Route;
  return ROUTES.includes(r) ? r : "compare";
};
export function useRoute(): Route {
  return useSyncExternalStore((cb) => { window.addEventListener("hashchange", cb); return () => window.removeEventListener("hashchange", cb); }, read);
}
export function go(route: Route) {
  if (read() === route) return;
  const run = () => { window.location.hash = `/${route}`; window.scrollTo(0, 0); };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (doc.startViewTransition && !reduce) doc.startViewTransition(run); else run();
}
