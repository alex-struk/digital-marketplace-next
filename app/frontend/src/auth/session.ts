import { useSyncExternalStore } from "react";
import { returnPathFrom } from "@rules/sign-in";
import {
  Account,
  endCurrentSession,
  fetchCurrentSession,
} from "../api/accounts";
import { originOfThisApp, useTokensFrom } from "../api/client";
import {
  IdentityClient,
  KeycloakIdentityClient,
  identitySettings,
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
 * Finds out who is using the app, once, as it starts: completes a sign-in the identity
 * provider has just returned from, or resumes one this browser holds, and then asks the
 * service for the account.
 */
export function startSession(client: IdentityClient = new KeycloakIdentityClient()): Promise<void> {
  identity = client;
  useTokensFrom(() => client.accessToken());
  started = findOutWho(client);
  return started;
}

/** Settles once the identity provider has been heard from, however that went. */
let started: Promise<void> = Promise.resolve();

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

/** Which way in a person chose: by the kind of account, or by an identity provider's own name. */
export function hintFor(provider: string | null | undefined): string | undefined {
  const { hints } = identitySettings();
  switch (provider) {
    case null:
    case undefined:
    case "":
      return undefined;
    case "vendor":
      return hints.vendor || undefined;
    case "public-sector":
      return hints.publicSector || undefined;
    default:
      return provider;
  }
}

/**
 * Where the identity provider sends the browser back to: the callback screen, carrying the
 * page sign-in began from, if there was one (R-4.22).
 */
export function callbackAddress(returnTo: string | null): string {
  const back = returnPathFrom(returnTo);
  const callback = `${originOfThisApp()}/auth/callback`;
  return back ? `${callback}?redirectOnSuccess=${encodeURIComponent(back)}` : callback;
}

/** Sends the browser to the identity provider to sign in. */
export async function beginSignIn(options: {
  provider?: string | null;
  returnTo?: string | null;
}): Promise<void> {
  if (!identity) throw new Error("The session has not been started.");
  // A person may choose a way in before the app has finished starting; the identity provider
  // is only asked once it has.
  await started.catch(() => undefined);
  await identity.signIn({
    returnTo: callbackAddress(options.returnTo ?? null),
    hint: hintFor(options.provider),
  });
}

/**
 * Signing out, from the service and then from the identity provider (R-4.17). The service is
 * told first, so that no token issued before now is accepted again; then the browser drops
 * its tokens and goes to the identity provider to end that session, which sends it back to
 * the signed-out screen. Says `false`, and changes nothing, if the service could not be told.
 */
export async function signOut(): Promise<boolean> {
  if (!identity) return false;
  if (state.status === "signed-in") {
    const ended = await endCurrentSession();
    if (!ended) return false;
  }
  become({ status: "visitor" });
  await identity.signOut({ returnTo: `${originOfThisApp()}/sign-out` });
  return true;
}

/** Leaves a refused sign-in, ending the identity provider's session too, so another can be tried. */
export async function leaveRefusedSignIn(returnTo: string): Promise<void> {
  become({ status: "visitor" });
  await identity?.signOut({ returnTo: `${originOfThisApp()}${returnTo}` });
}

/** For tests: back to the start, as if the app had just been opened. */
export function resetSessionForTests(next: SessionState = { status: "starting" }, client: IdentityClient | null = null): void {
  identity = client;
  started = Promise.resolve();
  if (client) useTokensFrom(() => client.accessToken());
  become(next);
}
