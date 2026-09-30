import Keycloak from "keycloak-js";

/**
 * The identity provider, as the single-page app talks to it: the sandbox Keycloak realm, by
 * OpenID Connect's authorization-code flow with PKCE, as a public client with no secret
 * (decision record 0004). Written as an interface so the screens can be tested without one.
 */
export interface IdentityClient {
  /**
   * Picks up where the person left off: completes a sign-in the identity provider has just
   * sent the browser back from, or resumes one this browser already holds. Says whether the
   * person is signed in.
   */
  start(): Promise<boolean>;
  /** Sends the browser to the identity provider to sign in, returning to `returnTo`. */
  signIn(options: { returnTo: string; hint?: string }): Promise<void>;
  /** Ends the identity provider's session and sends the browser to `returnTo`. */
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
  /** The identity-provider hint for each way in; empty when the realm has none to choose. */
  readonly hints: { readonly vendor: string; readonly publicSector: string };
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
    hints: {
      vendor: env.VITE_OIDC_IDP_HINT_VENDOR || "",
      publicSector: env.VITE_OIDC_IDP_HINT_PUBLIC_SECTOR || "",
    },
  };
}

interface HeldTokens {
  readonly token: string;
  readonly refreshToken: string;
  readonly idToken?: string;
}

/**
 * Where this browser keeps its tokens between screens and visits. Local storage, so that a
 * page opened in a new tab, or reloaded, is still signed in; cleared on signing out.
 */
const TOKENS_KEY = "digital-marketplace.tokens";

function readHeld(): HeldTokens | null {
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

export class KeycloakIdentityClient implements IdentityClient {
  private readonly keycloak: Keycloak;

  constructor(private readonly settings: IdentitySettings = identitySettings()) {
    this.keycloak = new Keycloak({
      url: settings.url,
      realm: settings.realm,
      clientId: settings.clientId,
    });
    this.keycloak.onAuthRefreshSuccess = () => this.hold();
  }

  private hold(): void {
    const { token, refreshToken, idToken } = this.keycloak;
    writeHeld(token && refreshToken ? { token, refreshToken, idToken } : null);
  }

  async start(): Promise<boolean> {
    const held = readHeld();
    try {
      const signedIn = await this.keycloak.init({
        pkceMethod: "S256",
        responseMode: "query",
        checkLoginIframe: false,
        ...(held ?? {}),
      });
      if (signedIn) this.hold();
      else writeHeld(null);
      return signedIn;
    } catch {
      // Tokens that can no longer be renewed, or a sign-in the identity provider refused.
      writeHeld(null);
      return false;
    }
  }

  async signIn({ returnTo, hint }: { returnTo: string; hint?: string }): Promise<void> {
    await this.keycloak.login({ redirectUri: returnTo, ...(hint ? { idpHint: hint } : {}) });
  }

  async signOut({ returnTo }: { returnTo: string }): Promise<void> {
    writeHeld(null);
    await this.keycloak.logout({ redirectUri: returnTo });
  }

  async accessToken(): Promise<string | null> {
    if (!this.keycloak.authenticated) return null;
    try {
      await this.keycloak.updateToken(30);
      return this.keycloak.token ?? null;
    } catch {
      this.forget();
      return null;
    }
  }

  forget(): void {
    writeHeld(null);
    this.keycloak.clearToken();
  }
}
