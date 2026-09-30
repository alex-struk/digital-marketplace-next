import { createRemoteJWKSet, jwtVerify, JWTVerifyGetKey } from "jose";
import { Identity, identityFromClaims } from "./identity";

/** Checks a bearer token and says whose it is, or throws when it is not good. */
export interface TokenVerifier {
  verify(token: string): Promise<Identity>;
}

export const TOKEN_VERIFIER = Symbol("TokenVerifier");

export class TokenRefused extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "TokenRefused";
  }
}

export interface OidcSettings {
  /** The realm, as its tokens name it in `iss`. */
  readonly issuer: string;
  /** The single-page app's client: tokens must be issued to it. */
  readonly clientId: string;
  /** Where the realm's signing keys are fetched from; beside the issuer unless said otherwise. */
  readonly keysAddress: string;
}

export function oidcSettingsFrom(env: NodeJS.ProcessEnv): OidcSettings | null {
  const issuer = env.OIDC_ISSUER?.trim().replace(/\/+$/, "");
  const clientId = env.OIDC_CLIENT_ID?.trim();
  if (!issuer || !clientId) return null;
  return {
    issuer,
    clientId,
    keysAddress:
      env.OIDC_JWKS_URL?.trim() || `${issuer}/protocol/openid-connect/certs`,
  };
}

/**
 * A token is good when the realm signed it, it is still in date, it was issued by the
 * configured realm, it is an access token rather than an ID token, and it was issued to this
 * service's client (decision record 0004). The realm's keys are fetched from its published
 * key set and cached.
 */
export class RealmTokenVerifier implements TokenVerifier {
  private readonly keys: JWTVerifyGetKey;

  constructor(
    private readonly settings: OidcSettings,
    keys?: JWTVerifyGetKey,
  ) {
    this.keys = keys ?? createRemoteJWKSet(new URL(settings.keysAddress));
  }

  async verify(token: string): Promise<Identity> {
    let claims: Record<string, unknown>;
    try {
      ({ payload: claims } = await jwtVerify(token, this.keys, {
        issuer: this.settings.issuer,
        clockTolerance: 5,
      }));
    } catch {
      throw new TokenRefused("The token is not good.");
    }
    if (claims.typ !== undefined && claims.typ !== "Bearer") {
      throw new TokenRefused("The token is not an access token.");
    }
    const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (claims.azp !== this.settings.clientId && !audience.includes(this.settings.clientId)) {
      throw new TokenRefused("The token was issued to somebody else.");
    }
    const identity = identityFromClaims(claims);
    if (!identity) throw new TokenRefused("The token names nobody.");
    return identity;
  }
}

/** Used when no realm is configured: every token is refused, and everyone is a visitor. */
export class NoRealm implements TokenVerifier {
  async verify(): Promise<Identity> {
    throw new TokenRefused("No identity provider is configured.");
  }
}
