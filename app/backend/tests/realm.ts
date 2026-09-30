import { createLocalJWKSet, exportJWK, generateKeyPair, JWK, SignJWT } from "jose";

/**
 * A stand-in for the sandbox realm, for tests: it signs tokens shaped the way the realm's are
 * and publishes the key they can be checked with. Nothing here reaches the application.
 */
export const ISSUER = "http://localhost:8080/realms/digital-marketplace";
export const CLIENT_ID = "digital-marketplace-app";

export interface TestRealm {
  readonly jwks: { keys: JWK[] };
  readonly keys: ReturnType<typeof createLocalJWKSet>;
  token(claims?: Record<string, unknown>, options?: { expiresIn?: string }): Promise<string>;
}

export async function testRealm(): Promise<TestRealm> {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const publicJwk = { ...(await exportJWK(publicKey)), kid: "test-key", alg: "RS256", use: "sig" };
  const jwks = { keys: [publicJwk] };
  return {
    jwks,
    keys: createLocalJWKSet(jwks),
    async token(claims = {}, options = {}) {
      return new SignJWT({
        typ: "Bearer",
        azp: CLIENT_ID,
        sid: "session-1",
        preferred_username: "first-time-vendor",
        name: "Jordan Placeholder",
        email: "First.Vendor@Example.test",
        identity_provider: "bceid",
        ...claims,
      })
        .setProtectedHeader({ alg: "RS256", kid: "test-key" })
        .setIssuer(typeof claims.iss === "string" ? claims.iss : ISSUER)
        .setIssuedAt()
        .setExpirationTime(options.expiresIn ?? "5m")
        .sign(privateKey);
    },
  };
}
