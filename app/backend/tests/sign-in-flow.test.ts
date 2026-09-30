import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  CodeNotExchanged,
  authorizationAddress,
  callbackAddress,
  challengeFor,
  cookiesOf,
  decodePending,
  encodePending,
  endIdentityProviderSession,
  exchangeCode,
  hintFor,
  newPendingSignIn,
  pendingCookieName,
  signInFlowSettingsFrom,
} from "../src/auth/sign-in-flow";

/**
 * Signing in as the service does it: the addresses it sends the
 * browser to, what it keeps while the browser is away, and how it asks the realm for tokens.
 */

const settings = signInFlowSettingsFrom({
  OIDC_ISSUER: "http://localhost:8080/realms/digital-marketplace/",
  OIDC_BACKCHANNEL_URL: "http://idp:8080/realms/digital-marketplace",
  OIDC_CLIENT_ID: "digital-marketplace-app",
  SERVICE_ORIGIN: "http://localhost:4300",
})!;

describe("the settings sign-in is read from", () => {
  it("names the realm as the browser reaches it, and as the service does", () => {
    expect(settings).toEqual({
      issuer: "http://localhost:8080/realms/digital-marketplace",
      backchannel: "http://idp:8080/realms/digital-marketplace",
      clientId: "digital-marketplace-app",
      serviceOrigin: "http://localhost:4300",
      hints: { vendor: "", publicSector: "" },
    });
  });

  it("reaches the realm the browser's way when no other is given", () => {
    const direct = signInFlowSettingsFrom({
      OIDC_ISSUER: "http://localhost:8080/realms/digital-marketplace",
      OIDC_CLIENT_ID: "digital-marketplace-app",
      SERVICE_ORIGIN: "http://localhost:4300",
    });
    expect(direct?.backchannel).toBe("http://localhost:8080/realms/digital-marketplace");
  });

  it("is absent without a realm, a client or the address the application answers at", () => {
    expect(signInFlowSettingsFrom({})).toBeNull();
    expect(
      signInFlowSettingsFrom({ OIDC_ISSUER: "http://idp", OIDC_CLIENT_ID: "app" }),
    ).toBeNull();
  });
});

describe("beginning sign-in", () => {
  const pending = newPendingSignIn("/dashboard", (size) => Buffer.alloc(size, 7));

  it("sends the browser to the realm's sign-in page with a PKCE challenge, as the public client", () => {
    const address = new URL(authorizationAddress(settings, pending));

    expect(address.origin + address.pathname).toBe(
      "http://localhost:8080/realms/digital-marketplace/protocol/openid-connect/auth",
    );
    expect(Object.fromEntries(address.searchParams)).toEqual({
      client_id: "digital-marketplace-app",
      redirect_uri: "http://localhost:4300/auth/callback",
      response_type: "code",
      scope: "openid",
      state: pending.state,
      code_challenge: createHash("sha256").update(pending.verifier).digest("base64url"),
      code_challenge_method: "S256",
    });
  });

  it("never puts the verifier, or a secret, in the address", () => {
    const address = authorizationAddress(settings, pending);

    expect(address).not.toContain(pending.verifier);
    expect(address).not.toContain("secret");
  });

  it("hints at an identity provider only when one is configured for the way chosen, or named", () => {
    const hinted = { ...settings, hints: { vendor: "github", publicSector: "idir" } };

    expect(hintFor(settings, "vendor")).toBeUndefined();
    expect(hintFor(hinted, "vendor")).toBe("github");
    expect(hintFor(hinted, "public-sector")).toBe("idir");
    expect(hintFor(hinted, "bceidbusiness")).toBe("bceidbusiness");
    expect(hintFor(hinted, null)).toBeUndefined();
    expect(new URL(authorizationAddress(hinted, pending, "github")).searchParams.get("kc_idp_hint")).toBe(
      "github",
    );
  });

  it("makes a fresh state and verifier every time", () => {
    const one = newPendingSignIn(null);
    const two = newPendingSignIn(null);

    expect(one.state).not.toBe(two.state);
    expect(one.verifier).not.toBe(two.verifier);
    expect(one.verifier.length).toBeGreaterThanOrEqual(43);
  });

  it("comes back to one fixed address, so it always matches the one the realm allows", () => {
    expect(callbackAddress(settings)).toBe("http://localhost:4300/auth/callback");
  });
});

describe("what the browser carries while it is away", () => {
  const pending = { state: "state-1", verifier: "verifier-1", returnTo: "/content/about" };

  it("is kept under a name of its own for each sign-in, and read back only for its own state", () => {
    const value = encodePending(pending);

    expect(pendingCookieName("state-1")).toBe("dm-sign-in-state-1");
    expect(decodePending(value, "state-1")).toEqual(pending);
    expect(decodePending(value, "state-2")).toBeNull();
    expect(decodePending(undefined, "state-1")).toBeNull();
    expect(decodePending("not-what-was-written", "state-1")).toBeNull();
  });

  it("is found among the cookies a request carries", () => {
    expect(cookiesOf("a=1; dm-sign-in-x=abc%3D; broken")).toEqual({ a: "1", "dm-sign-in-x": "abc=" });
    expect(cookiesOf(undefined)).toEqual({});
  });
});

describe("exchanging the code", () => {
  it("asks the realm as the service reaches it, proving the sign-in with the verifier", async () => {
    const fetch = vi.fn(async () =>
      Response.json({ access_token: "access", refresh_token: "refresh", id_token: "id" }),
    );

    const tokens = await exchangeCode(settings, "code-1", "verifier-1", fetch as never);

    expect(tokens).toEqual({ accessToken: "access", refreshToken: "refresh", idToken: "id" });
    const [address, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(address).toBe("http://idp:8080/realms/digital-marketplace/protocol/openid-connect/token");
    expect(Object.fromEntries(init.body as URLSearchParams)).toEqual({
      grant_type: "authorization_code",
      client_id: "digital-marketplace-app",
      code: "code-1",
      redirect_uri: "http://localhost:4300/auth/callback",
      code_verifier: "verifier-1",
    });
  });

  it("fails when the realm refuses, answers without tokens, or cannot be reached", async () => {
    const refusing = vi.fn(async () => new Response("{}", { status: 400 }));
    const empty = vi.fn(async () => Response.json({}));
    const unreachable = vi.fn(async () => Promise.reject(new TypeError("unreachable")));

    for (const fetch of [refusing, empty, unreachable]) {
      await expect(exchangeCode(settings, "c", "v", fetch as never)).rejects.toBeInstanceOf(
        CodeNotExchanged,
      );
    }
  });
});

describe("ending a refused sign-in's session at the realm", () => {
  it("asks the logout endpoint as the public client, with the refresh token", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));

    expect(await endIdentityProviderSession(settings, "refresh", fetch as never)).toBe(true);
    const [address, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(address).toBe("http://idp:8080/realms/digital-marketplace/protocol/openid-connect/logout");
    expect(Object.fromEntries(init.body as URLSearchParams)).toEqual({
      client_id: "digital-marketplace-app",
      refresh_token: "refresh",
    });
  });

  it("says so, rather than failing, when it cannot", async () => {
    const unreachable = vi.fn(async () => Promise.reject(new TypeError("unreachable")));

    expect(await endIdentityProviderSession(settings, "refresh", unreachable as never)).toBe(false);
  });
});

describe("the PKCE challenge", () => {
  it("is the verifier's SHA-256, base64url-encoded without padding", () => {
    // The worked example from the PKCE standard's appendix.
    expect(challengeFor("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    );
  });
});
