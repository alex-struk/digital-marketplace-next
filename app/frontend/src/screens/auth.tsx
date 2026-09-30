import { useEffect, useRef } from "react";
import { Heading } from "@bcgov/design-system-react-components";
import { useSearch } from "@tanstack/react-router";
import { landingAfterSignIn, returnPathFrom } from "@rules/sign-in";
import { page } from "../app/layout";
import { Loading } from "../app/loading";
import { useScreenTitle } from "../app/screen-title";
import { beginSignIn, useSession } from "../auth/session";
import { useGoTo } from "../app/go-to";

/**
 * `/auth/sign-in` — begins sign-in with the identity provider (the contract's startSignIn),
 * hinting at the way in `provider` names and carrying `redirectOnSuccess`, the page to come
 * back to (R-4.22). The browser leaves for the identity provider at once.
 */
export function AuthSignInScreen() {
  useScreenTitle("Sign In");
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const session = useSession();
  const goTo = useGoTo();
  const started = useRef(false);
  const provider = typeof search.provider === "string" ? search.provider : null;
  const returnTo = returnPathFrom(search.redirectOnSuccess);

  useEffect(() => {
    if (session.status === "starting" || started.current) return;
    started.current = true;
    if (session.status === "signed-in") {
      goTo(landingAfterSignIn(session.account, returnTo));
      return;
    }
    void beginSignIn({ provider, returnTo });
  }, [session, provider, returnTo, goTo]);

  return (
    <div style={page}>
      <Heading level={1}>Signing In</Heading>
      <Loading label="Taking you to sign in…" />
    </div>
  );
}

/**
 * `/auth/callback` — where the identity provider sends the browser back (the contract's
 * completeSignIn). By the time this is drawn the code has been exchanged and the service asked
 * for the account, which it made if this was the person's first sign-in (R-4.1). The person
 * is then taken to the page sign-in began from, or to profile completion or their dashboard
 * (R-4.22). A sign-in the service refused goes to the failure notice, which the app shows
 * everywhere for a refused session.
 */
export function AuthCallbackScreen() {
  useScreenTitle("Signing In");
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const session = useSession();
  const goTo = useGoTo();
  const returnTo = returnPathFrom(search.redirectOnSuccess);

  useEffect(() => {
    if (session.status === "signed-in") {
      goTo(landingAfterSignIn(session.account, returnTo));
    } else if (session.status === "visitor") {
      // The identity provider sent the browser back without a sign-in: it was cancelled or
      // failed there.
      goTo("/notice/authFailure");
    }
  }, [session, returnTo, goTo]);

  return (
    <div style={page}>
      <Heading level={1}>Signing In</Heading>
      <Loading label="Signing you in…" />
    </div>
  );
}
