import type { NextFunction, Response } from "express";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { bearerTokenCheck, IdentifiedRequest } from "../src/auth/bearer-token";
import { identityFromClaims } from "../src/auth/identity";
import { SignedOutSessions } from "../src/auth/signed-out-sessions";
import { oidcSettingsFrom, RealmTokenVerifier } from "../src/auth/token-verifier";
import { CLIENT_ID, ISSUER, testRealm, TestRealm } from "./realm";

let realm: TestRealm;
let verifier: RealmTokenVerifier;

beforeAll(async () => {
  realm = await testRealm();
  verifier = new RealmTokenVerifier(
    { issuer: ISSUER, clientId: CLIENT_ID, keysAddress: "http://unused.invalid" },
    realm.keys,
  );
});

describe("reading an identity from a token's claims", () => {
  it("takes the username, name, lower-cased email, identity provider and session", () => {
    expect(
      identityFromClaims({
        preferred_username: "test-vendor-1",
        given_name: "Alex",
        family_name: "Placeholder",
        email: "Vendor.One@Example.test",
        identity_provider: "bceid",
        sid: "abc",
        exp: 100,
      }),
    ).toEqual({
      username: "test-vendor-1",
      name: "Alex Placeholder",
      email: "vendor.one@example.test",
      identityProvider: "bceid",
      sessionId: "abc",
      expiresAt: 100,
    });
  });

  it("leaves the email empty when the identity provider shared none (R-4.1)", () => {
    expect(identityFromClaims({ preferred_username: "x" })?.email).toBeNull();
    expect(identityFromClaims({ preferred_username: "x" })?.name).toBe("x");
  });

  it("stands a token that names no session in for a session of its own (R-4.17)", () => {
    expect(identityFromClaims({ preferred_username: "x", jti: "t1" })?.sessionId).toBe("token:t1");
    expect(identityFromClaims({ preferred_username: "x", sid: "s", jti: "t1" })?.sessionId).toBe("s");
    expect(identityFromClaims({ preferred_username: "x" })?.sessionId).toBeNull();
  });

  it("names nobody without a username", () => {
    expect(identityFromClaims({ email: "a@b.cd" })).toBeNull();
  });
});

describe("checking a bearer token (decision record 0004)", () => {
  it("accepts a token the realm signed for this client", async () => {
    const identity = await verifier.verify(await realm.token());

    expect(identity.username).toBe("first-time-vendor");
    expect(identity.email).toBe("first.vendor@example.test");
  });

  it("accepts a token that names this client as its audience rather than its holder", async () => {
    const token = await realm.token({ azp: "another-client", aud: [CLIENT_ID, "account"] });

    await expect(verifier.verify(token)).resolves.toMatchObject({ username: "first-time-vendor" });
  });

  it("refuses a token issued to another client", async () => {
    await expect(verifier.verify(await realm.token({ azp: "another-client" }))).rejects.toThrow();
  });

  it("refuses a token from another realm", async () => {
    await expect(
      verifier.verify(await realm.token({ iss: "http://localhost:8080/realms/elsewhere" })),
    ).rejects.toThrow();
  });

  it("refuses an ID token passed off as an access token", async () => {
    await expect(verifier.verify(await realm.token({ typ: "ID" }))).rejects.toThrow();
  });

  it("refuses an expired token", async () => {
    const token = await realm.token({}, { expiresIn: "-1m" });
    await expect(verifier.verify(token)).rejects.toThrow();
  });

  it("refuses a token signed by anybody else", async () => {
    const other = await testRealm();
    await expect(verifier.verify(await other.token())).rejects.toThrow();
  });

  it("is configured from the environment, or not at all", () => {
    expect(oidcSettingsFrom({})).toBeNull();
    expect(
      oidcSettingsFrom({ OIDC_ISSUER: `${ISSUER}/`, OIDC_CLIENT_ID: CLIENT_ID }),
    ).toEqual({
      issuer: ISSUER,
      clientId: CLIENT_ID,
      keysAddress: `${ISSUER}/protocol/openid-connect/certs`,
    });
  });
});

function run(
  check: ReturnType<typeof bearerTokenCheck>,
  authorization?: string,
): Promise<{ request: IdentifiedRequest; status?: number; body?: unknown; passed: boolean }> {
  return new Promise((resolve) => {
    const request = { headers: authorization ? { authorization } : {} } as IdentifiedRequest;
    const outcome: { status?: number; body?: unknown } = {};
    const response = {
      status(code: number) {
        outcome.status = code;
        return this;
      },
      set() {
        return this;
      },
      json(body: unknown) {
        resolve({ request, ...outcome, body, passed: false });
        return this;
      },
    } as unknown as Response;
    const next: NextFunction = () => resolve({ request, passed: true });
    void check(request, response, next);
  });
}

describe("every request under /api (decision record 0004)", () => {
  it("goes on as a visitor's when it carries no token", async () => {
    const result = await run(bearerTokenCheck(verifier, new SignedOutSessions()));

    expect(result.passed).toBe(true);
    expect(result.request.identity).toBeNull();
  });

  it("goes on as the person's when its token is good", async () => {
    const result = await run(
      bearerTokenCheck(verifier, new SignedOutSessions()),
      `Bearer ${await realm.token()}`,
    );

    expect(result.passed).toBe(true);
    expect(result.request.identity?.username).toBe("first-time-vendor");
  });

  it("is refused, in the one shape every refusal takes, when its token is not good", async () => {
    const result = await run(bearerTokenCheck(verifier, new SignedOutSessions()), "Bearer nonsense");

    expect(result.passed).toBe(false);
    expect(result.status).toBe(401);
    expect(result.body).toEqual({ errors: [expect.any(String)] });
  });

  it("is refused when the authorization is not a bearer token at all", async () => {
    const result = await run(bearerTokenCheck(verifier, new SignedOutSessions()), "Basic abc");

    expect(result.status).toBe(401);
  });

  it("is refused once the person has signed out of the session its token came from (R-4.17)", async () => {
    const signedOut = new SignedOutSessions();
    const token = await realm.token({ sid: "ended" });
    signedOut.end("ended", Date.now() / 1000 + 300);

    const result = await run(bearerTokenCheck(verifier, signedOut), `Bearer ${token}`);

    expect(result.status).toBe(401);
  });
});

describe("the sessions a person has signed out of", () => {
  it("are remembered until their tokens would have expired, and then forgotten", () => {
    let now = 1000;
    const signedOut = new SignedOutSessions(() => now);
    signedOut.end("s", 1300);

    expect(signedOut.hasEnded("s")).toBe(true);
    expect(signedOut.hasEnded("other")).toBe(false);
    expect(signedOut.hasEnded(null)).toBe(false);
    now = 1301;
    expect(signedOut.hasEnded("s")).toBe(false);
  });

  it("do not include one that was never signed out of", () => {
    const signedOut = new SignedOutSessions(vi.fn(() => 0));
    expect(signedOut.hasEnded("never")).toBe(false);
  });
});
