// Light is the direction's default theme; dark only on an explicit toggle (ui-typography-and-color: apps never follow the OS).
const KEY = "goodleap-theme";
export type Theme = "light" | "dark";
export function storedTheme(): Theme {
  try { return localStorage.getItem(KEY) === "dark" ? "dark" : "light"; } catch { return "light"; }
}
export function applyTheme(t: Theme = storedTheme()) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem(KEY, t); } catch { /* private mode */ }
}
