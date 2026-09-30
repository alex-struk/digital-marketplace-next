import { useSyncExternalStore } from "react";
import { startSignInAddress } from "@rules/sign-in";
import {
  Account,
  SignOutAnswer,
  endCurrentSession,
  endCurrentSessionNow,
  fetchCurrentSession,
} from "../api/accounts";
import { originOfThisApp, useTokensFrom } from "../api/client";
import {
  IdentityClient,
  RealmIdentityClient,
  holdAccountLocally,
  readHeldAccount,
} from "./identity-client";

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
  // The account is kept beside the tokens, so the next page is drawn for the person at once
  // (decision record 0018); nobody signed in keeps nothing.
  if (next.status === "signed-in") holdAccountLocally(next.account);
  else if (next.status !== "starting") holdAccountLocally(null);
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

export interface StartOptions {
  /** The address the app was opened at. */
  readonly address?: string;
  /** Ends the service's session before returning; only used when the sign-out page is opened. */
  readonly endSessionNow?: () => SignOutAnswer;
}

/**
 * Finds out who is using the app, as it starts: takes over the tokens of a sign-in the service
 * has just completed, or resumes one this browser holds.
 *
 * What can be known without asking is settled before this returns, so the first screen is drawn
 * for whoever it is rather than after a round trip (decision record 0018): a visitor is a
 * visitor at once, and a person whose account the browser holds is drawn with it at once. The
 * service is then asked, and what it says replaces what was assumed.
 *
 * Opened at the sign-out page, the person is signed out before the first screen is drawn, so
 * the page says how it went as soon as it appears (R-4.17).
 */
export function startSession(
  client: IdentityClient = new RealmIdentityClient(),
  options: StartOptions = {},
): Promise<void> {
  identity = client;
  useTokensFrom(() => client.accessToken());
  signingOut = null;
  const address = options.address ?? currentAddress();
  const signedIn = client.start();

  if (address === SIGN_OUT_PAGE) {
    const underWay = signOutAtStart(client, signedIn, options.endSessionNow ?? endCurrentSessionNow);
    if (underWay) return underWay.then(() => undefined);
    // Settled one way or the other: there is nobody left to ask the service about.
    if (signOutAtStartOutcome() !== null) return Promise.resolve();
  }

  if (!signedIn) {
    become({ status: "visitor" });
    return Promise.resolve();
  }
  const known = readHeldAccount();
  if (known) become({ status: "signed-in", account: known });
  return askTheService(client);
}

function currentAddress(): string {
  return typeof window === "undefined" ? "/" : window.location.pathname;
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

/** Signing out as the sign-out page was opened: what came of it, or what is still under way. */
let signingOut: { outcome: SignOutOutcome | null; underWay: Promise<SignOutOutcome> | null } | null =
  null;

/** How signing out went, when it was done as the sign-out page was opened; null otherwise. */
export function signOutAtStartOutcome(): SignOutOutcome | null {
  return signingOut?.outcome ?? null;
}

/** Signing out begun as the sign-out page was opened and not yet finished, if any. */
export function signOutAtStartUnderWay(): Promise<SignOutOutcome> | null {
  return signingOut?.underWay ?? null;
}

/**
 * The service is told first, by the browser's cookie, and ends its own session and the
 * identity provider's before answering (decision record 0018). When it has done both, the
 * person is signed out before the page is drawn. When it held no session for the cookie — a
 * sign-in older than the cookie, or none at all — the page signs out the usual way, with the
 * token, once it is drawn. Returns what is still under way, if anything.
 */
function signOutAtStart(
  client: IdentityClient,
  signedIn: boolean,
  endSessionNow: () => SignOutAnswer,
): Promise<SignOutOutcome> | null {
  const answer = endSessionNow();
  if (answer.heldOne && answer.identityProviderSignedOut) {
    client.forget();
    become({ status: "visitor" });
    signingOut = { outcome: "signed-out", underWay: null };
    return null;
  }
  if (answer.heldOne) {
    // The service's session is over; the identity provider's is ended from the page, and
    // until it has been the person is not told they are signed out.
    const underWay = endAtTheIdentityProvider(client).then((outcome) => {
      if (signingOut) signingOut = { outcome, underWay: null };
      return outcome;
    });
    signingOut = { outcome: null, underWay };
    return underWay;
  }
  if (!signedIn) {
    // No token here either. If the service was told, nothing is left to end; if it could not
    // be, a session it holds for this browser may still stand.
    become({ status: "visitor" });
    signingOut = { outcome: answer.ended ? "signed-out" : "failed", underWay: null };
  }
  return null;
}

async function endAtTheIdentityProvider(client: IdentityClient): Promise<SignOutOutcome> {
  if (await client.endSession()) {
    become({ status: "visitor" });
    return "signed-out";
  }
  await client.signOut({ returnTo: `${originOfThisApp()}${SIGN_OUT_PAGE}` });
  return "leaving";
}

/**
 * Signing out, from the service and then from the identity provider (R-4.17). The service is
 * told first, so that no token issued before now is accepted again, and it ends the identity
 * provider's session too when it can. Otherwise the identity provider's session is ended from
 * the page, and the person is told only once it has said so. If it cannot be ended that way,
 * the browser drops its tokens and goes to the identity provider to end it there; the person
 * is still signed in, as far as the screens go, until it comes back.
 */
export async function signOut(): Promise<SignOutOutcome> {
  if (!identity) return "failed";
  if (state.status === "signed-in") {
    const answer = await endCurrentSession();
    if (!answer.ended) return "failed";
    if (answer.identityProviderSignedOut) {
      identity.forget();
      become({ status: "visitor" });
      return "signed-out";
    }
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
  signingOut = null;
  if (client) useTokensFrom(() => client.accessToken());
  become(next);
}
