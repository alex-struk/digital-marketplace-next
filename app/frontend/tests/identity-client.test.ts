import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("keycloak-js", () => ({
  default: class {
    refreshToken: string | undefined = "a-refresh-token";
    clearToken = vi.fn(() => {
      this.refreshToken = undefined;
    });
  },
}));

const { KeycloakIdentityClient } = await import("../src/auth/identity-client");

const settings = {
  url: "http://idp.example.test",
  realm: "digital-marketplace",
  clientId: "digital-marketplace-app",
  hints: { vendor: "", publicSector: "" },
};

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("ending the identity provider's session from the page (R-4.17)", () => {
  it("asks the realm's logout endpoint as the public client, with the refresh token, and forgets the tokens", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    window.localStorage.setItem("digital-marketplace.tokens", "{}");

    expect(await new KeycloakIdentityClient(settings).endSession()).toBe(true);

    const [address, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(address).toBe(
      "http://idp.example.test/realms/digital-marketplace/protocol/openid-connect/logout",
    );
    expect(init.method).toBe("POST");
    expect(Object.fromEntries(init.body as URLSearchParams)).toEqual({
      client_id: "digital-marketplace-app",
      refresh_token: "a-refresh-token",
    });
    expect(window.localStorage.getItem("digital-marketplace.tokens")).toBeNull();
  });

  it("says it could not when the identity provider refuses or cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 400 })));
    expect(await new KeycloakIdentityClient(settings).endSession()).toBe(false);

    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("blocked"))));
    expect(await new KeycloakIdentityClient(settings).endSession()).toBe(false);
  });
});
