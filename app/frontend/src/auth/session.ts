import { useSyncExternalStore } from "react";
import { startSignInAddress } from "@rules/sign-in";
import { Account, endCurrentSession, fetchCurrentSession } from "../api/accounts";
import { originOfThisApp, useTokensFrom } from "../api/client";
import { IdentityClient, RealmIdentityClient } from "./identity-client";

/**
 * Who is using the app, held once for every screen.
 *
 * - `starting` — the app has not yet found out.
 * - `visitor` — nobody is signed in.
 * - `signed-in` — the account the service holds for the person.
 * - `refused` — the identity provider let the person in, and the service would not
 *   (R-4.1, R-4.4, R-4.6). The sign-in failure notice is shown.
 */
export type SessionState =
  | { readonly status: "starting" }
  | { readonly status: "visitor" }
  | { readonly status: "signed-in"; readonly account: Account }
  | { readonly status: "refused" };

let state: SessionState = { status: "starting" };
const listeners = new Set<() => void>();
let identity: IdentityClient | null = null;

function become(next: SessionState): void {
  state = next;
  for (const listener of listeners) listener();
}

export function currentSession(): SessionState {
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The session, for a screen; the screen is drawn again whenever it changes. */
export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, currentSession, currentSession);
}

/** The account a screen was just told about, such as one it has saved. */
export function holdAccount(account: Account): void {
  become({ status: "signed-in", account });
}

/** The sign-out page (user-sign-out). */
export const SIGN_OUT_PAGE = "/sign-out";

/**
 * Finds out who is using the app, as it starts: takes over the tokens of a sign-in the service
 * has just completed, or resumes one this browser holds, and asks the service whose they are.
 * A browser holding no tokens is a visitor's, and the service need not be asked.
 */
export function startSession(client: IdentityClient = new RealmIdentityClient()): Promise<void> {
  identity = client;
  useTokensFrom(() => client.accessToken());
  if (!client.start()) {
    become({ status: "visitor" });
    return Promise.resolve();
  }
  return askTheService(client);
}

async function askTheService(client: IdentityClient): Promise<void> {
  const answer = await fetchCurrentSession();
  if (answer.kind === "signed-in") become({ status: "signed-in", account: answer.account });
  // The tokens are kept for now: leaving a refused sign-in ends the identity provider's
  // session with them (leaveRefusedSignIn).
  else if (answer.kind === "refused") become({ status: "refused" });
  else {
    client.forget();
    become({ status: "visitor" });
  }
}

/**
 * Sends the browser to sign in, at the service, which goes on to the identity provider with
 * the way in the person chose and brings them back to the page sign-in began from (R-4.22;
 * decision record 0015).
 */
export async function beginSignIn(options: {
  provider?: string | null;
  returnTo?: string | null;
}): Promise<void> {
  if (!identity) throw new Error("The session has not been started.");
  await identity.signIn({
    address: startSignInAddress(options.provider ?? null, options.returnTo ?? null),
  });
}

/**
 * How signing out went: `signed-out` once both the service and the identity provider have
 * ended the session; `failed` if the service could not be told, when nothing has changed;
 * `leaving` when the browser has been sent to the identity provider to finish it, which sends
 * it back to the signed-out screen.
 */
export type SignOutOutcome = "signed-out" | "failed" | "leaving";

async function endAtTheIdentityProvider(client: IdentityClient): Promise<SignOutOutcome> {
  if (await client.endSession()) {
    become({ status: "visitor" });
    return "signed-out";
  }
  await client.signOut({ returnTo: `${originOfThisApp()}${SIGN_OUT_PAGE}` });
  return "leaving";
}

/**
 * Signing out, from the service and the identity provider (R-4.17), in one request to the
 * service: it ends its own session, named by the browser's token or cookie, and the identity
 * provider's, with the refresh token sign-in was completed with (decision record 0018). When
 * the service could not end the identity provider's session, the page ends it itself, and the
 * person is told only once it has said so. If it cannot be ended that way, the browser drops
 * its tokens and goes to the identity provider to end it there; the person is still signed
 * in, as far as the screens go, until it comes back.
 *
 * A refused sign-in has no session at the service, only at the identity provider.
 */
export async function signOut(): Promise<SignOutOutcome> {
  if (!identity) return "failed";
  if (state.status === "refused") return endAtTheIdentityProvider(identity);
  const wasSignedIn = state.status === "signed-in";
  const answer = await endCurrentSession();
  if (!answer.ended) return "failed";
  if (answer.identityProviderSignedOut || (!wasSignedIn && !answer.heldOne)) {
    identity.forget();
    become({ status: "visitor" });
    return "signed-out";
  }
  return endAtTheIdentityProvider(identity);
}

/** Leaves a refused sign-in, ending the identity provider's session too, so another can be tried. */
export async function leaveRefusedSignIn(returnTo: string): Promise<void> {
  become({ status: "visitor" });
  await identity?.signOut({ returnTo: `${originOfThisApp()}${returnTo}` });
}

/** For tests: back to the start, as if the app had just been opened. */
export function resetSessionForTests(next: SessionState = { status: "starting" }, client: IdentityClient | null = null): void {
  identity = client;
  if (client) useTokensFrom(() => client.accessToken());
  become(next);
}
