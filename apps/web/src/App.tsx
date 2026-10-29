// The shell: backdrop and the floating window (rail + top bar + the current screen), plus the SCR-2 slot: the
// question box opens as a slide-over above SCR-1 when session.askOpen && session.selected. Owned by Foundation.
import { Component, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRoute } from "./router";
import { session, useSession } from "./state/session";
import { byRoute } from "./screens/registry";
import { Rail, TopBar } from "./components/Shell";
import { Skeleton, SlideOver } from "./components/ui";
import { AskAboutOption } from "./components/AskAboutOption";

class ScreenBoundary extends Component<{ children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="p-7" role="alert">
        <h2 data-focus tabIndex={-1} className="text-[18px] font-extrabold">This screen didn't open</h2>
        <p className="mt-2 text-muted">Something went wrong opening this screen. Use Start over in the rail, or reload the page.</p>
        {import.meta.env.DEV && <details className="mt-3 text-[13px] text-muted"><summary>Details for the builder</summary><pre className="whitespace-pre-wrap">{this.state.error.message}</pre></details>}
      </div>
    );
  }
}

export default function App() {
  const route = useRoute();
  const s = useSession();
  const screen = byRoute(route);
  const Screen = screen.component;
  const [said, setSaid] = useState("");
  const handled = useRef<string | null>(null);
  const closeAsk = useCallback(() => session.set({ askOpen: false }), []);

  useEffect(() => {
    document.title = `${screen.title} · GoodLeap (concept prototype)`;
    if (handled.current === null || handled.current === route) { handled.current = route; return; }
    handled.current = route;
    setSaid(screen.title);
    let tries = 0, raf = 0;
    const seek = () => {
      const el = document.querySelector<HTMLElement>("#screen [data-focus]");
      if (el) el.focus({ preventScroll: true });
      else if (++tries < 90) raf = requestAnimationFrame(seek);
    };
    raf = requestAnimationFrame(seek);
    return () => cancelAnimationFrame(raf);
  }, [route, screen]);

  return (
    <>
      <div className="backdrop" aria-hidden />
      <div className="win">
        <Rail screen={screen} s={s} />
        <main className="main">
          <TopBar screen={screen} />
          <div id="screen" className="screen">
            <ScreenBoundary key={route}>
              <Suspense fallback={<div className="flex flex-col gap-3 p-7"><Skeleton className="h-8 w-64" /><Skeleton className="h-40" /></div>}>
                <Screen />
              </Suspense>
            </ScreenBoundary>
          </div>
        </main>
      </div>
      {route === "compare" && s.askOpen && s.selected && (
        <SlideOver title={`About the ${s.selected.productName}`} onClose={closeAsk}>
          <AskAboutOption scenario={s.selected} />
        </SlideOver>
      )}
      <p className="sr-only" aria-live="polite" aria-atomic="true">{said}</p>
    </>
  );
}
