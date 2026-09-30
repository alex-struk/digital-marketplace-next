import { createHash, randomBytes } from "node:crypto";

/**
 * Signing in with the identity provider, as the service does it (decision record 0015).
 *
 * The contract's `startSignIn` and `completeSignIn` are the service's own addresses, each
 * answering with a redirect: the first to the identity provider, the second to the page the
 * person lands on (R-4.22). OpenID Connect's authorization-code flow with PKCE, as a public
 * client: no secret is held anywhere, and the code can be exchanged only by whoever made the
 * challenge. By the time the browser arrives at the landing page the account exists (R-4.1),
 * the welcome is on its way (R-4.2), and the tokens are in the browser.
 *
 * Nothing here is NestJS; the controller in `auth.controller.ts` is the thin part.
 */

export interface SignInFlowSettings {
  /** The realm as the browser reaches it, and as its tokens name it in `iss`. */
  readonly issuer: string;
  /** The realm as the service reaches it; the same address unless said otherwise. */
  readonly backchannel: string;
  readonly clientId: string;
  /** Where the application answers, which the identity provider sends the browser back to. */
  readonly serviceOrigin: string;
  /** The identity-provider hint for each way in; empty when the realm has none to choose. */
  readonly hints: { readonly vendor: string; readonly publicSector: string };
}

const trimmed = (value: string | undefined) => value?.trim().replace(/\/+$/, "") ?? "";

export function signInFlowSettingsFrom(env: NodeJS.ProcessEnv): SignInFlowSettings | null {
  const issuer = trimmed(env.OIDC_ISSUER);
  const clientId = env.OIDC_CLIENT_ID?.trim() ?? "";
  const serviceOrigin = trimmed(env.SERVICE_ORIGIN);
  if (!issuer || !clientId || !serviceOrigin) return null;
  return {
    issuer,
    backchannel: trimmed(env.OIDC_BACKCHANNEL_URL) || issuer,
    clientId,
    serviceOrigin,
    hints: {
      vendor: env.OIDC_IDP_HINT_VENDOR?.trim() ?? "",
      publicSector: env.OIDC_IDP_HINT_PUBLIC_SECTOR?.trim() ?? "",
    },
  };
}

/** Where the identity provider sends the browser back to. Fixed, so it always matches. */
export function callbackAddress(settings: SignInFlowSettings): string {
  return `${settings.serviceOrigin}/auth/callback`;
}

/** Which way in a person chose: by the kind of account, or by an identity provider's own name. */
export function hintFor(
  settings: SignInFlowSettings,
  provider: string | null | undefined,
): string | undefined {
  switch (provider) {
    case null:
    case undefined:
    case "":
      return undefined;
    case "vendor":
      return settings.hints.vendor || undefined;
    case "public-sector":
      return settings.hints.publicSector || undefined;
    default:
      return provider;
  }
}

// ------------------------------------------------------------------------ starting

/** A sign-in under way: what the browser carries between leaving and coming back. */
export interface PendingSignIn {
  readonly state: string;
  readonly verifier: string;
  /** The page sign-in began from, if any (R-4.22). */
  readonly returnTo: string | null;
}

const base64url = (bytes: Buffer) => bytes.toString("base64url");

/** PKCE's S256 challenge for a verifier. */
export function challengeFor(verifier: string): string {
  return base64url(createHash("sha256").update(verifier).digest());
}

export function newPendingSignIn(
  returnTo: string | null,
  random: (size: number) => Buffer = randomBytes,
): PendingSignIn {
  return {
    state: base64url(random(24)),
    verifier: base64url(random(48)),
    returnTo,
  };
}

/** The identity provider's sign-in page, asked for a code this sign-in alone can exchange. */
export function authorizationAddress(
  settings: SignInFlowSettings,
  pending: PendingSignIn,
  hint?: string,
): string {
  const query = new URLSearchParams({
    client_id: settings.clientId,
    redirect_uri: callbackAddress(settings),
    response_type: "code",
    scope: "openid",
    state: pending.state,
    code_challenge: challengeFor(pending.verifier),
    code_challenge_method: "S256",
  });
  if (hint) query.set("kc_idp_hint", hint);
  return `${settings.issuer}/protocol/openid-connect/auth?${query.toString()}`;
}

/**
 * The pending sign-in is kept in a cookie of its own, named by its state, so that two sign-ins
 * begun in two tabs do not overwrite each other. It holds the verifier, which is why it is
 * readable only by the service.
 */
export const PENDING_COOKIE_PREFIX = "dm-sign-in-";
export const PENDING_LIFETIME_SECONDS = 10 * 60;

export function pendingCookieName(state: string): string {
  return `${PENDING_COOKIE_PREFIX}${state}`;
}

export function encodePending(pending: PendingSignIn): string {
  return Buffer.from(JSON.stringify(pending), "utf8").toString("base64url");
}

export function decodePending(value: string | undefined, state: string): PendingSignIn | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<
      PendingSignIn
    >;
    if (parsed.state !== state || typeof parsed.verifier !== "string") return null;
    return {
      state,
      verifier: parsed.verifier,
      returnTo: typeof parsed.returnTo === "string" ? parsed.returnTo : null,
    };
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------------ completing

export interface Tokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly idToken: string | null;
}

export class CodeNotExchanged extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "CodeNotExchanged";
  }
}

type Fetch = typeof fetch;

/** Exchanges the code for tokens, proving with the verifier that this sign-in asked for it. */
export async function exchangeCode(
  settings: SignInFlowSettings,
  code: string,
  verifier: string,
  fetchImpl: Fetch = fetch,
): Promise<Tokens> {
  let response: Response;
  try {
    response = await fetchImpl(`${settings.backchannel}/protocol/openid-connect/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: settings.clientId,
        code,
        redirect_uri: callbackAddress(settings),
        code_verifier: verifier,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new CodeNotExchanged("The identity provider could not be reached.");
  }
  if (!response.ok) throw new CodeNotExchanged(`The identity provider answered ${response.status}.`);
  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  const accessToken = body?.access_token;
  const refreshToken = body?.refresh_token;
  if (typeof accessToken !== "string" || typeof refreshToken !== "string") {
    throw new CodeNotExchanged("The identity provider answered without tokens.");
  }
  return {
    accessToken,
    refreshToken,
    idToken: typeof body?.id_token === "string" ? body.id_token : null,
  };
}

/**
 * Ends the identity provider's session a refused sign-in made, so the person can try again
 * with another identity (R-4.4). Best effort: the refusal stands whether or not this works.
 */
export async function endIdentityProviderSession(
  settings: SignInFlowSettings,
  refreshToken: string,
  fetchImpl: Fetch = fetch,
): Promise<boolean> {
  try {
    const response = await fetchImpl(`${settings.backchannel}/protocol/openid-connect/logout`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: settings.clientId, refresh_token: refreshToken }),
      signal: AbortSignal.timeout(5_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------------ handing over

/**
 * The tokens reach the single-page app in cookies set on the redirect to the landing page.
 * They are there before the landing page's first byte, so however soon the browser is sent
 * somewhere else, the person is signed in. The app moves them into its own storage as it
 * starts and clears them. They are short-lived and read by script, because the app is what
 * presents them, as a bearer token on every request to `/api` (decision record 0004).
 */
export const HANDOVER_COOKIES = {
  access: "dm-handover-access",
  refresh: "dm-handover-refresh",
  id: "dm-handover-id",
} as const;

export const HANDOVER_LIFETIME_SECONDS = 5 * 60;

/** The cookies a request carried, by name. */
export function cookiesOf(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const part of (header ?? "").split(";")) {
    const at = part.indexOf("=");
    if (at <= 0) continue;
    const name = part.slice(0, at).trim();
    const value = part.slice(at + 1).trim();
    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }
  }
  return cookies;
}
