import { useEffect, useRef } from "react";
import { Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { needsProfileCompletion } from "@rules/users";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { SessionProvider, useCurrentAddress, useSession } from "../auth/session";

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
  return (
    <SessionProvider>
      <Screens />
    </SessionProvider>
  );
}

function Screens() {
  const address = useRouterState({ select: (state) => state.location.pathname });
  const firstScreen = useRef(true);
  useFinishSigningUpFirst();

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

/**
 * Screens a vendor who has not finished signing up may still open: finishing it, signing
 * out, the sign-in machinery, the notices, and the service's own pages — the terms and the
 * privacy policy they are asked to agree to among them.
 */
export function isOpenBeforeFinishingSignUp(pathname: string): boolean {
  return (
    pathname === "/sign-up/complete" ||
    pathname === "/sign-out" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/notice/") ||
    pathname.startsWith("/content/")
  );
}

/**
 * A vendor who has never agreed to the terms is sent to finish signing up from every other
 * screen they open (R-4.3), and brought back to it once they have.
 */
function useFinishSigningUpFirst(): void {
  const { session } = useSession();
  const router = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const address = useCurrentAddress();
  const mustFinish = session.status === "signed-in" && needsProfileCompletion(session.user);

  useEffect(() => {
    if (!mustFinish || isOpenBeforeFinishingSignUp(pathname)) return;
    const returnTo = pathname === "/" || pathname === "/dashboard" ? null : address;
    const query = returnTo ? `?${new URLSearchParams({ redirectOnSuccess: returnTo })}` : "";
    router.history.replace(`/sign-up/complete${query}`);
  }, [mustFinish, pathname, address, router]);
}
