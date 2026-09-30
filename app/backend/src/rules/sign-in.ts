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
 * whose account has just been made — of any kind — goes to the profile-completion page, as
 * does a vendor who has never agreed to the terms, and everyone else to their dashboard. The
 * completion page moves on to the dashboard anybody it is not offered to (R-4.23).
 */
export function landingAfterSignIn(
  account: TermsRecord,
  returnTo: string | null,
  created = false,
): string {
  const back = returnPathFrom(returnTo);
  if (back) return back;
  return created || needsProfileCompletion(account) ? PROFILE_COMPLETION : DASHBOARD;
}

/**
 * The screens a vendor who has not completed their profile may still open. Every other screen
 * sends them to the completion page first. The service's own pages stay open, because the
 * completion page asks them to read the terms and the privacy policy there. So does their own
 * profile: any signed-in person can open it at the address that stands for them (R-4.26), and
 * it is where the account a first sign-in made is seen (R-4.1, R-4.2).
 */
export function openBeforeProfileCompletion(path: string, ownId?: string | null): boolean {
  const trimmed = path.length > 1 ? path.replace(/\/+$/, "") : path;
  return (
    trimmed === PROFILE_COMPLETION ||
    trimmed === "/sign-out" ||
    trimmed === "/users/me" ||
    (Boolean(ownId) && trimmed === `/users/${ownId}`) ||
    trimmed.startsWith("/auth/") ||
    trimmed.startsWith("/notice/") ||
    trimmed.startsWith("/content/")
  );
}

/**
 * The service's own address where sign-in begins (the contract's startSignIn), naming the way
 * in the person chose and the page to come back to, if there is one (R-4.22). The service
 * sends the browser on to the identity provider from there (decision record 0015).
 */
export function startSignInAddress(
  provider: string | null,
  returnTo: string | null,
): string {
  const query = new URLSearchParams();
  if (provider) query.set("provider", provider);
  const back = returnPathFrom(returnTo);
  if (back) query.set("redirectOnSuccess", back);
  const asked = query.toString();
  return asked ? `/auth/sign-in?${asked}` : "/auth/sign-in";
}

/** The sign-in address that brings a person back to the given page afterwards. */
export function signInReturningTo(path: string): string {
  const back = returnPathFrom(path);
  return back
    ? `${SIGN_IN}?redirectOnSuccess=${encodeURIComponent(back)}`
    : SIGN_IN;
}
