import { safeReturnAddress } from "@rules/users";
import {
  endpoints,
  identityProviderSettings,
  IdentityProviderSettings,
} from "./identity-provider";
import { clearTokens, readTokens, Tokens, tokensFrom, writeTokens } from "./tokens";

/**
 * Signing in with the identity provider by the authorization-code flow with PKCE, from the
 * browser, as a public client (the stack profile, decision record 0004). No secret is held
 * anywhere in the app: what proves the browser that began a sign-in is the one finishing it
 * is a random verifier it keeps to itself and a hash of it sent up front.
 */

/** What a sign-in in progress keeps across the trip to the identity provider and back. */
interface Pending {
  readonly state: string;
  readonly verifier: string;
  readonly returnTo: string | null;
}

const PENDING_KEY = "digital-marketplace.sign-in";

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomText(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

export async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

/** The one address both legs of the flow name, and the identity provider checks. */
export function callbackAddress(): string {
  return `${window.location.origin}/auth/callback`;
}

/**
 * Where the browser goes to sign in: the identity provider, hinted at the kind of identity
 * the person chose — `github` for a vendor, `idir` for a public sector employee — and told
 * to come back to the callback.
 */
export async function signInAddress(
  provider: string | null,
  returnTo: string | null,
  settings?: IdentityProviderSettings,
): Promise<string> {
  const { issuer, clientId } = settings ?? (await identityProviderSettings());
  const pending: Pending = {
    state: randomText(),
    verifier: randomText(),
    returnTo: safeReturnAddress(returnTo),
  };
  window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  const query = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: "openid profile email",
    redirect_uri: callbackAddress(),
    state: pending.state,
    code_challenge: await challengeFor(pending.verifier),
    code_challenge_method: "S256",
  });
  if (provider) query.set("kc_idp_hint", provider);
  return `${endpoints(issuer).authorize}?${query.toString()}`;
}

/** Send the browser to the identity provider. */
export async function beginSignIn(provider: string | null, returnTo: string | null): Promise<void> {
  window.location.assign(await signInAddress(provider, returnTo));
}

export type Exchange =
  | { readonly ok: true; readonly tokens: Tokens; readonly returnTo: string | null }
  | { readonly ok: false };

/**
 * The callback's half: the code the identity provider sent back is exchanged for tokens,
 * provided it answers the sign-in this browser began. Anything else — an error from the
 * identity provider, a state this browser did not issue, a code that will not exchange — is
 * a failed sign-in.
 */
export async function completeSignIn(query: URLSearchParams): Promise<Exchange> {
  const raw = window.sessionStorage.getItem(PENDING_KEY);
  window.sessionStorage.removeItem(PENDING_KEY);
  if (!raw) return { ok: false };
  let pending: Pending;
  try {
    pending = JSON.parse(raw) as Pending;
  } catch {
    return { ok: false };
  }
  const code = query.get("code");
  if (!code || query.get("error") || query.get("state") !== pending.state) {
    return { ok: false };
  }
  const { issuer, clientId } = await identityProviderSettings();
  try {
    const answer = await globalThis.fetch(endpoints(issuer).token, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: callbackAddress(),
        client_id: clientId,
        code_verifier: pending.verifier,
      }),
    });
    if (!answer.ok) return { ok: false };
    const tokens = tokensFrom((await answer.json()) as Record<string, unknown>);
    if (!tokens) return { ok: false };
    writeTokens(tokens);
    return { ok: true, tokens, returnTo: pending.returnTo };
  } catch {
    return { ok: false };
  }
}

let refreshing: Promise<Tokens | null> | null = null;

/**
 * An access token that will still be accepted for at least the next half-minute, renewed
 * with the refresh token when it will not. Null when there is none to be had, which means
 * nobody is signed in any more.
 */
export async function currentAccessToken(): Promise<string | null> {
  const tokens = readTokens();
  if (!tokens) return null;
  if (tokens.expiresAt - Date.now() > 30_000) return tokens.accessToken;
  refreshing ??= renew(tokens).finally(() => {
    refreshing = null;
  });
  return (await refreshing)?.accessToken ?? null;
}

async function renew(tokens: Tokens): Promise<Tokens | null> {
  if (!tokens.refreshToken) {
    clearTokens();
    return null;
  }
  try {
    const { issuer, clientId } = await identityProviderSettings();
    const answer = await globalThis.fetch(endpoints(issuer).token, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokens.refreshToken,
        client_id: clientId,
      }),
    });
    if (!answer.ok) {
      clearTokens();
      return null;
    }
    const renewed = tokensFrom((await answer.json()) as Record<string, unknown>);
    if (!renewed) {
      clearTokens();
      return null;
    }
    const kept = { ...renewed, idToken: renewed.idToken ?? tokens.idToken };
    writeTokens(kept);
    return kept;
  } catch {
    // The identity provider could not be reached; the old token is tried as it is.
    return tokens;
  }
}

/**
 * Where the browser goes to end its session with the identity provider (R-4.17), coming back
 * to `returnTo` afterwards. The tokens are gone from the browser before it leaves.
 */
export async function signOutAddress(idToken: string | null, returnTo: string): Promise<string> {
  const { issuer, clientId } = await identityProviderSettings();
  const query = new URLSearchParams({
    client_id: clientId,
    post_logout_redirect_uri: `${window.location.origin}${returnTo}`,
  });
  if (idToken) query.set("id_token_hint", idToken);
  return `${endpoints(issuer).endSession}?${query.toString()}`;
}
