import { useEffect, useRef } from "react";
import { Outlet, useRouterState } from "@tanstack/react-router";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

/**
 * Every screen: the banner, the screen itself, and the footer after it, whatever the
 * viewer's sign-in state (R-7.19).
 *
 * Moving from one screen to another inside the app moves focus to the new screen's heading,
 * so a keyboard or screen-reader user is taken to the new screen rather than left where the
 * link was (design/DESIGN.md, "Document title and focus"). The first screen of a visit is
 * left alone: nothing has moved yet.
 */
export function RootLayout() {
  const address = useRouterState({ select: (state) => state.location.pathname });
  const firstScreen = useRef(true);

  useEffect(() => {
    if (firstScreen.current) {
      firstScreen.current = false;
      return;
    }
    // After the new screen has been put on the page, not while it is being put there: a
    // heading focused mid-change is replaced a moment later and the focus goes with it.
    const afterTheScreenIsThere = setTimeout(() => {
      const heading = document.querySelector<HTMLElement>("main h1");
      if (!heading) return;
      heading.tabIndex = -1;
      heading.focus();
    }, 0);
    return () => clearTimeout(afterTheScreenIsThere);
  }, [address]);

  return (
    <>
      <SiteHeader />
      <main id="main">
        <Outlet />
      </main>
      <SiteFooter />
    </>
  );
}
