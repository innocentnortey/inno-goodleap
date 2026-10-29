// The seven screens (PRD §5) in rail order. Owned by Foundation; each segment owns its screen file only.
import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { Route } from "../router";

export interface ScreenMeta {
  route: Route;
  scr: string;
  title: string;
  /** Journey step (1–5) shown in the rail; reviewer screens have none. */
  step?: number;
  who: "Contractor" | "Contractor + homeowner" | "Homeowner" | "Reviewer";
  component: LazyExoticComponent<ComponentType>;
}

export const SCREENS: ScreenMeta[] = [
  { route: "compare", scr: "SCR-1", step: 1, title: "Compare options", who: "Contractor + homeowner", component: lazy(() => import("./Compare")) },
  { route: "apply", scr: "SCR-3", step: 3, title: "Start application", who: "Contractor", component: lazy(() => import("./StartApplication")) },
  { route: "verify", scr: "SCR-4", step: 4, title: "Verify income", who: "Homeowner", component: lazy(() => import("./VerifyIncome")) },
  { route: "review", scr: "SCR-5", step: 5, title: "Review and submit", who: "Homeowner", component: lazy(() => import("./Review")) },
  { route: "audit", scr: "SCR-6", title: "Compliance audit", who: "Reviewer", component: lazy(() => import("./Audit")) },
  { route: "next", scr: "SCR-7", title: "Where we'd take it next", who: "Reviewer", component: lazy(() => import("./Roadmap")) },
];

export const byRoute = (r: Route) => SCREENS.find((s) => s.route === r) ?? SCREENS[0];
