import { useEffect, useRef } from "react";
import { Outlet, useRouterState } from "@tanstack/react-router";
import { openBeforeProfileCompletion, PROFILE_COMPLETION } from "@rules/sign-in";
import { needsProfileCompletion } from "@rules/users";
import { leaveRefusedSignIn, useSession } from "../auth/session";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { PageContainer } from "./page-layout";
import { useGoTo } from "./go-to";
import { LOADING_SHOWN_AFTER_MS } from "./loading";

const HEADING_LOOK_EVERY_MS = 50;

/**
 * A vendor who has not finished signing up is sent to finish it from every screen but the few
 * they need on the way: signing out, the notices, the service's own pages, where the terms
 * and the privacy policy they are asked to agree to are read, and their own profile (R-4.3,
 * R-4.23, R-4.26).
 */
function useSignUpFinishedFirst(address: string): void {
  const session = useSession();
  const goTo = useGoTo();
  const unfinished = session.status === "signed-in" && needsProfileCompletion(session.account);
  const ownId = session.status === "signed-in" ? session.account.id : null;
  useEffect(() => {
    if (unfinished && !openBeforeProfileCompletion(address, ownId)) {
      goTo(PROFILE_COMPLETION);
    }
  }, [unfinished, address, ownId, goTo]);
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
    // heading focused mid-change is replaced a moment later and the focus goes with it. A
    // screen drawn once what it shows has arrived has no heading until then (decision record
    // 0039), so the heading is looked for until it is there, for as long as that screen would
    // take to say it is loading.
    let waited = 0;
    let timer = setTimeout(function focusTheHeading() {
      const heading = document.querySelector<HTMLElement>("main h1");
      if (!heading) {
        waited += HEADING_LOOK_EVERY_MS;
        if (waited <= LOADING_SHOWN_AFTER_MS) timer = setTimeout(focusTheHeading, HEADING_LOOK_EVERY_MS);
        return;
      }
      heading.tabIndex = -1;
      heading.focus();
    }, 0);
    return () => clearTimeout(timer);
  }, [address]);

  return (
    <>
      <SiteHeader />
      <main id="main">
        {/* The one column every screen sits in, the width of the banner (design/catalogue/layout.tsx). */}
        <PageContainer>
          <Outlet />
        </PageContainer>
      </main>
      <SiteFooter />
    </>
  );
}
