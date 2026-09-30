/**
 * Who a bearer token says the person is, as the identity provider vouched for it. It is not
 * an account: the account is the service's own record, found or made from this (R-4.1).
 */
export interface Identity {
  /** The sign-in username, which the kept schema stores as `idpUsername` and `idpId`. */
  readonly username: string;
  readonly name: string;
  /** Lower case, or null when the identity provider shared none (R-4.1). */
  readonly email: string | null;
  /** Which way in the person came: "idir", "github", "bceid" and so on. */
  readonly identityProvider: string | null;
  /** The identity provider's session, which signing out ends (R-4.17). */
  readonly sessionId: string | null;
  /** When the token stops being good, in seconds since the epoch. */
  readonly expiresAt: number;
}

function text(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  if (Array.isArray(value)) return text(value[0]);
  return null;
}

/**
 * Reads an identity out of a verified token's claims. A token with no username names nobody,
 * and is refused.
 */
export function identityFromClaims(claims: Record<string, unknown>): Identity | null {
  const username = text(claims.preferred_username);
  if (!username) return null;
  const given = text(claims.given_name);
  const family = text(claims.family_name);
  const name =
    text(claims.name) ??
    ([given, family].filter(Boolean).join(" ") || username);
  const email = text(claims.email);
  return {
    username,
    name,
    email: email ? email.toLowerCase() : null,
    identityProvider: text(claims.identity_provider),
    sessionId: text(claims.sid) ?? text(claims.session_state),
    expiresAt: typeof claims.exp === "number" ? claims.exp : 0,
  };
}
