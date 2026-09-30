/**
 * Where signing in begins and ends, as plain TypeScript (decision record 0001).
 */
import { TermsRecord, needsProfileCompletion } from "./users";

export const DASHBOARD = "/dashboard";
export const PROFILE_COMPLETION = "/sign-up/complete";
export const SIGN_IN = "/sign-in";

/**
 * A page a person may be returned to once they have signed in: an address on this service,
 * written as a path. Anything that would lead off the service — another host, a
 * protocol-relative address, a scheme — is not one, so sign-in cannot be used to send a
 * person somewhere else.
 */
export function returnPathFrom(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (/[\\\s]/.test(value)) return null;
  // The sign-in and sign-out screens themselves are never somewhere to come back to.
  const path = value.split(/[?#]/)[0] ?? "";
  if (path === SIGN_IN || path.startsWith("/auth/") || path === "/sign-out") {
    return null;
  }
  return value;
}

/**
 * Where a person lands once sign-in is complete (R-4.22).
 *
 * A person who began signing in from a particular page is returned to it. Otherwise a person
 * whose profile is still to be completed — every newly made vendor account, and a vendor who
 * has never agreed to the terms — goes to the profile-completion page, and everyone else to
 * their dashboard. A newly made public sector account would be sent on from the completion
 * page to the dashboard at once (R-4.23), so it is sent there directly.
 */
export function landingAfterSignIn(
  account: TermsRecord,
  returnTo: string | null,
): string {
  const back = returnPathFrom(returnTo);
  if (back) return back;
  return needsProfileCompletion(account) ? PROFILE_COMPLETION : DASHBOARD;
}

/**
 * The screens a vendor who has not completed their profile may still open. Every other screen
 * sends them to the completion page first. The service's own pages stay open, because the
 * completion page asks them to read the terms and the privacy policy there.
 */
export function openBeforeProfileCompletion(path: string): boolean {
  return (
    path === PROFILE_COMPLETION ||
    path === "/sign-out" ||
    path.startsWith("/auth/") ||
    path.startsWith("/notice/") ||
    path.startsWith("/content/")
  );
}

/** The sign-in address that brings a person back to the given page afterwards. */
export function signInReturningTo(path: string): string {
  const back = returnPathFrom(path);
  return back
    ? `${SIGN_IN}?redirectOnSuccess=${encodeURIComponent(back)}`
    : SIGN_IN;
}
