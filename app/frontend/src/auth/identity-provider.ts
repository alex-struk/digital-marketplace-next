/**
 * Where the identity provider is, and which client this app signs in as (decision record
 * 0004). The client is public: there is no secret here or anywhere in the browser.
 *
 * The web server in front of the app answers `/app-config.json` with the settings of the
 * environment it runs in (app/frontend/Caddyfile). On a builder's machine, where nothing
 * answers it, the sandbox realm in app/compose is assumed.
 */
export interface IdentityProviderSettings {
  readonly issuer: string;
  readonly clientId: string;
}

export const SANDBOX_SETTINGS: IdentityProviderSettings = {
  issuer: "http://localhost:8080/realms/digital-marketplace",
  clientId: "digital-marketplace-app",
};

let settings: Promise<IdentityProviderSettings> | null = null;

export function identityProviderSettings(): Promise<IdentityProviderSettings> {
  settings ??= readSettings();
  return settings;
}

async function readSettings(): Promise<IdentityProviderSettings> {
  try {
    const answer = await globalThis.fetch(new URL("/app-config.json", window.location.origin));
    if (!answer.ok) return SANDBOX_SETTINGS;
    const body = (await answer.json()) as Record<string, unknown>;
    const issuer = typeof body.oidcIssuer === "string" && body.oidcIssuer ? body.oidcIssuer : null;
    const clientId =
      typeof body.oidcClientId === "string" && body.oidcClientId ? body.oidcClientId : null;
    return {
      issuer: (issuer ?? SANDBOX_SETTINGS.issuer).replace(/\/+$/, ""),
      clientId: clientId ?? SANDBOX_SETTINGS.clientId,
    };
  } catch {
    return SANDBOX_SETTINGS;
  }
}

/** The realm's own addresses, which Keycloak fixes relative to the issuer. */
export function endpoints(issuer: string) {
  const base = `${issuer}/protocol/openid-connect`;
  return {
    authorize: `${base}/auth`,
    token: `${base}/token`,
    endSession: `${base}/logout`,
  };
}
