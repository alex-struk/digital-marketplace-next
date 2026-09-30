import { Account, readAccount } from "../api/accounts";

/**
 * The identity provider, as the single-page app deals with it: the sandbox Keycloak realm, a
 * public client with no secret (decision records 0004 and 0015).
 *
 * Signing in begins and ends at the service (`/auth/sign-in`, `/auth/callback`), which hands
 * the tokens over in short-lived cookies on its redirect to the landing page. From then on
 * this is what holds them, renews the access token from the refresh token, and ends the
 * identity provider's session on signing out. Written as an interface so the screens can be
 * tested without a realm.
 */
export interface IdentityClient {
  /**
   * Picks up where the person left off: takes over tokens the service has just handed over,
   * or resumes the ones this browser already holds. Says whether the person is signed in.
   * Asks nothing of the network, and answers at once, so the first screen can be drawn for
   * whoever it is (decision record 0018).
   */
  start(): boolean;
  /** Sends the browser to where sign-in begins, at the service. */
  signIn(options: { address: string }): Promise<void>;
  /**
   * Ends the identity provider's session from here, without leaving the page, and drops what
   * this browser holds if it was ended. Says whether the identity provider confirmed it; when
   * it did not, `signOut` is the way left.
   */
  endSession(): Promise<boolean>;
  /** Ends the identity provider's session by visiting it, and comes back to `returnTo`. */
  signOut(options: { returnTo: string }): Promise<void>;
  /** A current access token, renewed first if it is about to run out; null if none can be had. */
  accessToken(): Promise<string | null>;
  /** Drops what this browser holds, without telling the identity provider. */
  forget(): void;
}

export interface IdentitySettings {
  readonly url: string;
  readonly realm: string;
  readonly clientId: string;
}

/**
 * Read at build time. The defaults are the local sandbox (app/compose/compose.yaml); an
 * environment that differs says so when the app is built.
 */
export function identitySettings(): IdentitySettings {
  const env = import.meta.env;
  return {
    url: (env.VITE_OIDC_URL || "http://localhost:8080").replace(/\/+$/, ""),
    realm: env.VITE_OIDC_REALM || "digital-marketplace",
    clientId: env.VITE_OIDC_CLIENT_ID || "digital-marketplace-app",
  };
}

export interface HeldTokens {
  readonly token: string;
  readonly refreshToken: string;
  readonly idToken?: string;
}

/**
 * Where this browser keeps its tokens between screens and visits. Local storage, so that a
 * page opened in a new tab, or reloaded, is still signed in; cleared on signing out.
 */
export const TOKENS_KEY = "digital-marketplace.tokens";

export function readHeld(): HeldTokens | null {
  try {
    const value = window.localStorage.getItem(TOKENS_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<HeldTokens>;
    return parsed.token && parsed.refreshToken
      ? { token: parsed.token, refreshToken: parsed.refreshToken, idToken: parsed.idToken }
      : null;
  } catch {
    return null;
  }
}

function writeHeld(tokens: HeldTokens | null): void {
  try {
    if (tokens) window.localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
    else window.localStorage.removeItem(TOKENS_KEY);
  } catch {
    // A browser that keeps nothing still signs in; it just does so again on the next visit.
  }
}

/**
 * The account the service last answered for the person holding these tokens, kept beside them
 * so a page opened or reloaded is drawn for that person at once and then brought up to date by
 * asking the service (decision record 0018). Cleared whenever the tokens are.
 */
export const ACCOUNT_KEY = "digital-marketplace.account";

export function readHeldAccount(): Account | null {
  try {
    const value = window.localStorage.getItem(ACCOUNT_KEY);
    return value ? readAccount(JSON.parse(value)) : null;
  } catch {
    return null;
  }
}

export function holdAccountLocally(account: Account | null): void {
  try {
    if (account) window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
    else window.localStorage.removeItem(ACCOUNT_KEY);
  } catch {
    // Kept nowhere: the account is asked for on every page instead.
  }
}

/** The cookies the service hands the tokens over in (app/backend/src/auth/sign-in-flow.ts). */
export const HANDOVER_COOKIES = {
  access: "dm-handover-access",
  refresh: "dm-handover-refresh",
  id: "dm-handover-id",
  account: "dm-handover-account",
} as const;

function cookieNamed(name: string): string | null {
  for (const part of document.cookie.split(";")) {
    const at = part.indexOf("=");
    if (at > 0 && part.slice(0, at).trim() === name) {
      const value = part.slice(at + 1).trim();
      try {
        return decodeURIComponent(value) || null;
      } catch {
        return value || null;
      }
    }
  }
  return null;
}

/**
 * Takes over the tokens a sign-in that has just completed handed over, keeping them as this
 * browser's own and clearing the cookies they came in. Runs as the app starts, before
 * anything else is asked, so a sign-in is never lost however soon the page is left.
 */
export function adoptHandedOverTokens(): boolean {
  const token = cookieNamed(HANDOVER_COOKIES.access);
  const refreshToken = cookieNamed(HANDOVER_COOKIES.refresh);
  const idToken = cookieNamed(HANDOVER_COOKIES.id);
  const account = cookieNamed(HANDOVER_COOKIES.account);
  for (const name of Object.values(HANDOVER_COOKIES)) {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
  }
  if (!token || !refreshToken) return false;
  writeHeld({ token, refreshToken, ...(idToken ? { idToken } : {}) });
  // The account signed in with comes too; one that cannot be read is asked for instead.
  let handedOver: Account | null = null;
  try {
    handedOver = account ? readAccount(JSON.parse(account)) : null;
  } catch {
    handedOver = null;
  }
  holdAccountLocally(handedOver);
  return true;
}

/** When a token stops being good, in seconds since the epoch; 0 when it cannot be read. */
export function expiryOf(token: string): number {
  try {
    const payload = token.split(".")[1] ?? "";
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))) as {
      exp?: unknown;
    };
    return typeof claims.exp === "number" ? claims.exp : 0;
  } catch {
    return 0;
  }
}

/** Renewed this many seconds before it runs out, so no request goes out with a dying token. */
const RENEW_WITHIN_SECONDS = 30;

export class RealmIdentityClient implements IdentityClient {
  private renewing: Promise<string | null> | null = null;

  constructor(
    private readonly settings: IdentitySettings = identitySettings(),
    private readonly now: () => number = () => Date.now() / 1000,
    /** How the browser is sent to another address; the page is left. */
    private readonly go: (address: string) => void = (address) => window.location.assign(address),
  ) {}

  private endpoint(name: "token" | "logout"): string {
    const { url, realm } = this.settings;
    return `${url}/realms/${encodeURIComponent(realm)}/protocol/openid-connect/${name}`;
  }

  start(): boolean {
    adoptHandedOverTokens();
    const held = readHeld();
    if (!held) return false;
    // A refresh token that has run out can renew nothing; an access token that has too is no
    // use. Either way the person is no longer signed in.
    const refreshExpiry = expiryOf(held.refreshToken);
    if (refreshExpiry !== 0 && refreshExpiry <= this.now() && expiryOf(held.token) <= this.now()) {
      this.forget();
      return false;
    }
    return true;
  }

  async signIn({ address }: { address: string }): Promise<void> {
    this.go(address);
  }

  async accessToken(): Promise<string | null> {
    const held = readHeld();
    if (!held) return null;
    if (expiryOf(held.token) - RENEW_WITHIN_SECONDS > this.now()) return held.token;
    this.renewing ??= this.renew(held).finally(() => {
      this.renewing = null;
    });
    return this.renewing;
  }

  /** OpenID Connect's refresh grant, as the public client may ask it. */
  private async renew(held: HeldTokens): Promise<string | null> {
    try {
      const response = await fetch(this.endpoint("token"), {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: this.settings.clientId,
          refresh_token: held.refreshToken,
        }),
      });
      if (response.ok) {
        const body = (await response.json()) as Record<string, unknown>;
        if (typeof body.access_token === "string") {
          writeHeld({
            token: body.access_token,
            refreshToken:
              typeof body.refresh_token === "string" ? body.refresh_token : held.refreshToken,
            idToken: typeof body.id_token === "string" ? body.id_token : held.idToken,
          });
          return body.access_token;
        }
      }
    } catch {
      // Unreachable is the same as refused, below.
    }
    // Renewal refused. A token still in date is used while it lasts; after that, nobody is
    // signed in.
    if (expiryOf(held.token) > this.now()) return held.token;
    this.forget();
    return null;
  }

  /**
   * OpenID Connect's logout endpoint, asked with the refresh token as a public client may
   * (no secret), ends the session at Keycloak and answers 204 (R-4.17).
   */
  async endSession(): Promise<boolean> {
    const held = readHeld();
    if (!held) return false;
    try {
      const response = await fetch(this.endpoint("logout"), {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: this.settings.clientId,
          refresh_token: held.refreshToken,
        }),
      });
      if (!response.ok) return false;
    } catch {
      return false;
    }
    this.forget();
    return true;
  }

  async signOut({ returnTo }: { returnTo: string }): Promise<void> {
    const held = readHeld();
    const query = new URLSearchParams({
      client_id: this.settings.clientId,
      post_logout_redirect_uri: returnTo,
    });
    if (held?.idToken) query.set("id_token_hint", held.idToken);
    this.forget();
    this.go(`${this.endpoint("logout")}?${query.toString()}`);
  }

  forget(): void {
    writeHeld(null);
    holdAccountLocally(null);
  }
}
