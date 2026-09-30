import { useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "@tanstack/react-router";
import { Heading } from "@bcgov/design-system-react-components";
import { needsProfileCompletion } from "@rules/users";
import { fetchCurrentSession, User } from "../api/users";
import { page } from "../app/layout";
import { LoadingStatus } from "../app/loading-status";
import { useScreenTitle } from "../app/screen-title";
import { completeSignIn, signOutAddress } from "../auth/pkce";
import { useSession } from "../auth/session";
import { clearTokens } from "../auth/tokens";

export const SIGN_IN_FAILED = "/notice/authFailure";

/**
 * Where a person goes once they are signed in (R-4.22): back to the page they began from,
 * if they began from one; otherwise a vendor who has not finished signing up goes to finish
 * it, and everyone else to their dashboard. A public sector employee sent to finish signing
 * up is moved straight on to the dashboard anyway (R-4.23), so they are sent there directly.
 */
export function destinationAfterSignIn(user: User, returnTo: string | null): string {
  if (returnTo) return returnTo;
  return needsProfileCompletion(user) ? "/sign-up/complete" : "/dashboard";
}

/**
 * `/auth/callback` — where the identity provider sends the browser back (decision records
 * 0003, 0004). The code is exchanged for tokens, the service is asked who they sign in as —
 * making the account on a first sign-in (R-4.1) — and the person is taken on.
 *
 * A sign-in that fails at any step — an identity the service does not recognise, an account
 * an administrator deactivated (R-4.4), a new account that would share an address (R-4.6) —
 * lands on the sign-in failure notice, having ended the identity provider's session too, so
 * the next attempt starts afresh rather than signing the same identity straight back in.
 */
export function AuthCallbackScreen({ query }: { readonly query: string }) {
  useScreenTitle("Signing In");
  const router = useRouter();
  const { signedIn, signedOut } = useSession();
  const started = useRef(false);

  useEffect(() => {
    // Once only: a code can be exchanged a single time.
    if (started.current) return;
    started.current = true;

    void (async () => {
      const exchange = await completeSignIn(new URLSearchParams(query));
      if (!exchange.ok) {
        signedOut();
        router.history.replace(SIGN_IN_FAILED);
        return;
      }
      const answer = await fetchCurrentSession();
      if (answer.kind !== "signed-in") {
        clearTokens();
        signedOut();
        window.location.replace(await signOutAddress(exchange.tokens.idToken, SIGN_IN_FAILED));
        return;
      }
      // The account is on every screen before the person is taken on, so the screen they land
      // on never sees them as signed out and sends them back to sign in.
      flushSync(() => signedIn(answer.user));
      router.history.replace(destinationAfterSignIn(answer.user, exchange.returnTo));
    })();
  }, [query, router, signedIn, signedOut]);

  return (
    <div style={page}>
      <Heading level={1}>Signing In</Heading>
      <LoadingStatus label="Signing in" text="Signing you in…" />
    </div>
  );
}
