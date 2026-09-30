import { useEffect, useRef } from "react";
import { Outlet, useRouterState } from "@tanstack/react-router";
import { openBeforeProfileCompletion, PROFILE_COMPLETION } from "@rules/sign-in";
import { needsProfileCompletion } from "@rules/users";
import { leaveRefusedSignIn, useSession } from "../auth/session";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { useGoTo } from "./go-to";

/**
 * A vendor who has not finished signing up is sent to finish it from every screen but the few
 * they need on the way: signing out, the notices, and the service's own pages, where the terms
 * and the privacy policy they are asked to agree to are read (R-4.3, R-4.23).
 */
function useSignUpFinishedFirst(address: string): void {
  const session = useSession();
  const goTo = useGoTo();
  const unfinished = session.status === "signed-in" && needsProfileCompletion(session.account);
  useEffect(() => {
    if (unfinished && !openBeforeProfileCompletion(address)) {
      goTo(PROFILE_COMPLETION);
    }
  }, [unfinished, address, goTo]);
}

/**
 * A sign-in the service refused ends at the identity provider too, so the person can try
 * another, and lands on the sign-in failure notice (R-4.1, R-4.4, R-4.6).
 */
function useRefusedSignInLeft(): void {
  const session = useSession();
  useEffect(() => {
    if (session.status === "refused") void leaveRefusedSignIn("/notice/authFailure");
  }, [session.status]);
}

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
  useSignUpFinishedFirst(address);
  useRefusedSignInLeft();

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
