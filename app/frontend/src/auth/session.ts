import { useSyncExternalStore } from "react";
import { startSignInAddress } from "@rules/sign-in";
import {
  Account,
  endCurrentSession,
  fetchCurrentSession,
} from "../api/accounts";
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

/**
 * Finds out who is using the app, once, as it starts: takes over the tokens of a sign-in the
 * service has just completed, or resumes one this browser holds, and then asks the service
 * for the account.
 */
export function startSession(client: IdentityClient = new RealmIdentityClient()): Promise<void> {
  identity = client;
  useTokensFrom(() => client.accessToken());
  // The handed-over tokens are taken before this returns: `start` asks nothing of the
  // network before it has them.
  return findOutWho(client);
}

async function findOutWho(client: IdentityClient): Promise<void> {
  const signedIn = await client.start();
  if (!signedIn) {
    become({ status: "visitor" });
    return;
  }
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

/**
 * Signing out, from the service and then from the identity provider (R-4.17). The service is
 * told first, so that no token issued before now is accepted again. The identity provider's
 * session is then ended from the page, and the person is told only once it has said so. If it
 * cannot be ended that way, the browser drops its tokens and goes to the identity provider to
 * end it there; the person is still signed in, as far as the screens go, until it comes back.
 */
export async function signOut(): Promise<SignOutOutcome> {
  if (!identity) return "failed";
  if (state.status === "signed-in") {
    const ended = await endCurrentSession();
    if (!ended) return "failed";
  }
  if (await identity.endSession()) {
    become({ status: "visitor" });
    return "signed-out";
  }
  await identity.signOut({ returnTo: `${originOfThisApp()}/sign-out` });
  return "leaving";
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
