// Entry: tokens and Manrope (via index.css), the theme before first paint, then the shell.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { applyTheme } from "./lib/theme";
import App from "./App";

applyTheme();
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
