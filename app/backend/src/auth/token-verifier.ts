import { createRemoteJWKSet, jwtVerify, JWTPayload, JWTVerifyGetKey } from "jose";
import type { IdentityConfig } from "../common/config";

/**
 * Who a token says its bearer is, as far as this service needs to know (decision record
 * 0004): the identity, which kind of identity it is, and what the identity provider shared.
 */
export interface Claims {
  /** The sign-in username; the kept schema's `idpId` and `idpUsername` both hold it. */
  readonly username: string;
  /** Which way in the person came through: `idir` or `github` (R-4.1). */
  readonly identityProvider: string | null;
  readonly name: string | null;
  readonly email: string | null;
  /** The identity provider's session, which signing out ends (R-4.17). */
  readonly sessionId: string | null;
  /** When the token stops being accepted, in seconds since the epoch. */
  readonly expiresAt: number;
}

export interface TokenVerifier {
  /** The claims of a token this service accepts, or null for any token it does not. */
  verify(token: string): Promise<Claims | null>;
}

export const TOKEN_VERIFIER = Symbol("TokenVerifier");

/**
 * Checks a bearer token against the realm's published keys, its issuer, its expiry and the
 * client it was issued to. A token that fails any of these is not accepted and says nothing
 * about who is asking.
 */
export class RealmTokenVerifier implements TokenVerifier {
  private readonly keys: JWTVerifyGetKey;

  constructor(
    private readonly config: IdentityConfig,
    keys?: JWTVerifyGetKey,
  ) {
    this.keys = keys ?? createRemoteJWKSet(new URL(config.jwksUri));
  }

  async verify(token: string): Promise<Claims | null> {
    try {
      const { payload } = await jwtVerify(token, this.keys, {
        issuer: this.config.issuer,
        clockTolerance: 30,
      });
      if (!issuedTo(payload, this.config.clientId)) return null;
      return claimsOf(payload);
    } catch {
      return null;
    }
  }
}

/** A token issued to the single-page app: its authorized party, or one of its audiences. */
function issuedTo(payload: JWTPayload, clientId: string): boolean {
  if (payload.azp === clientId) return true;
  const audience = payload.aud;
  return Array.isArray(audience) ? audience.includes(clientId) : audience === clientId;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function claimsOf(payload: JWTPayload): Claims | null {
  const username = text(payload.preferred_username);
  if (!username || typeof payload.exp !== "number") return null;
  const given = text(payload.given_name);
  const family = text(payload.family_name);
  return {
    username,
    identityProvider: text(payload.identity_provider),
    name: text(payload.name) ?? ([given, family].filter(Boolean).join(" ") || null),
    email: text(payload.email),
    sessionId: text(payload.sid),
    expiresAt: payload.exp,
  };
}
