import { afterEach, describe, expect, it, vi } from "vitest";
import {
  HANDOVER_COOKIES,
  RealmIdentityClient,
  TOKENS_KEY,
  adoptHandedOverTokens,
  expiryOf,
  readHeld,
} from "../src/auth/identity-client";

const settings = {
  url: "http://idp.example.test",
  realm: "digital-marketplace",
  clientId: "digital-marketplace-app",
};

const NOW = 1_800_000_000;

/** A token shaped like the realm's, running out at `exp`. Nothing checks its signature here. */
function token(exp: number, extra: Record<string, unknown> = {}): string {
  const encode = (value: unknown) =>
    btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${encode({ alg: "RS256" })}.${encode({ exp, ...extra })}.signature`;
}

function hold(tokens: { token: string; refreshToken: string; idToken?: string }) {
  window.localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

function clearCookies() {
  for (const name of Object.values(HANDOVER_COOKIES)) {
    document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
}

const client = () => new RealmIdentityClient(settings, () => NOW);

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
  clearCookies();
});

describe("taking over a sign-in the service has just completed (decision record 0015)", () => {
  it("keeps the handed-over tokens as this browser's own and clears the cookies they came in", () => {
    const access = token(NOW + 300);
    document.cookie = `${HANDOVER_COOKIES.access}=${access}; Path=/`;
    document.cookie = `${HANDOVER_COOKIES.refresh}=refresh-1; Path=/`;
    document.cookie = `${HANDOVER_COOKIES.id}=id-1; Path=/`;

    expect(adoptHandedOverTokens()).toBe(true);

    expect(readHeld()).toEqual({ token: access, refreshToken: "refresh-1", idToken: "id-1" });
    expect(document.cookie).not.toContain("dm-handover");
  });

  it("replaces tokens held from an earlier sign-in", () => {
    hold({ token: "old", refreshToken: "old-refresh" });
    document.cookie = `${HANDOVER_COOKIES.access}=new; Path=/`;
    document.cookie = `${HANDOVER_COOKIES.refresh}=new-refresh; Path=/`;

    adoptHandedOverTokens();

    expect(readHeld()).toMatchObject({ token: "new", refreshToken: "new-refresh" });
  });

  it("leaves what is held alone when nothing was handed over", () => {
    hold({ token: "held", refreshToken: "held-refresh" });

    expect(adoptHandedOverTokens()).toBe(false);
    expect(readHeld()).toMatchObject({ token: "held" });
  });

  it("is what starting does first, without asking the network anything", () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    document.cookie = `${HANDOVER_COOKIES.access}=${token(NOW + 300)}; Path=/`;
    document.cookie = `${HANDOVER_COOKIES.refresh}=${token(NOW + 1800)}; Path=/`;

    expect(client().start()).toBe(true);
    expect(readHeld()).not.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("is signed out when what is held has run out and cannot be renewed", () => {
    hold({ token: token(NOW - 10), refreshToken: token(NOW - 5) });

    expect(client().start()).toBe(false);
    expect(readHeld()).toBeNull();
  });

  it("forgets the tokens, leaving nothing of the sign-in in local storage", () => {
    hold({ token: token(NOW + 300), refreshToken: "refresh-1" });

    client().forget();

    expect(readHeld()).toBeNull();
    expect(Object.keys(window.localStorage)).toEqual([]);
  });
});

describe("the access token each request carries", () => {
  it("is the held one while it is in date", async () => {
    const access = token(NOW + 300);
    hold({ token: access, refreshToken: "refresh" });
    vi.stubGlobal("fetch", vi.fn());

    expect(await client().accessToken()).toBe(access);
  });

  it("is renewed from the refresh token as the public client, shortly before it runs out", async () => {
    hold({ token: token(NOW + 10), refreshToken: "refresh-1", idToken: "id-1" });
    const renewed = token(NOW + 300);
    const fetch = vi.fn(async () =>
      new Response(JSON.stringify({ access_token: renewed, refresh_token: "refresh-2" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetch);

    expect(await client().accessToken()).toBe(renewed);

    const [address, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(address).toBe(
      "http://idp.example.test/realms/digital-marketplace/protocol/openid-connect/token",
    );
    expect(Object.fromEntries(init.body as URLSearchParams)).toEqual({
      grant_type: "refresh_token",
      client_id: "digital-marketplace-app",
      refresh_token: "refresh-1",
    });
    expect(readHeld()).toEqual({ token: renewed, refreshToken: "refresh-2", idToken: "id-1" });
  });

  it("is still the held one when renewal is refused but it has not yet run out", async () => {
    const access = token(NOW + 10);
    hold({ token: access, refreshToken: "refresh" });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 400 })));

    expect(await client().accessToken()).toBe(access);
  });

  it("is none, and nothing is held, once it has run out and cannot be renewed", async () => {
    hold({ token: token(NOW - 1), refreshToken: "refresh" });
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("unreachable"))));

    expect(await client().accessToken()).toBeNull();
    expect(readHeld()).toBeNull();
  });

  it("reads when a token runs out, and treats one it cannot read as run out", () => {
    expect(expiryOf(token(NOW))).toBe(NOW);
    expect(expiryOf("not-a-token")).toBe(0);
  });
});

describe("ending the identity provider's session from the page (R-4.17)", () => {
  it("asks the realm's logout endpoint as the public client, with the refresh token, and forgets the tokens", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    hold({ token: token(NOW + 300), refreshToken: "a-refresh-token" });

    expect(await client().endSession()).toBe(true);

    const [address, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(address).toBe(
      "http://idp.example.test/realms/digital-marketplace/protocol/openid-connect/logout",
    );
    expect(init.method).toBe("POST");
    expect(Object.fromEntries(init.body as URLSearchParams)).toEqual({
      client_id: "digital-marketplace-app",
      refresh_token: "a-refresh-token",
    });
    expect(window.localStorage.getItem(TOKENS_KEY)).toBeNull();
  });

  it("says it could not when the identity provider refuses or cannot be reached, and keeps the tokens", async () => {
    hold({ token: token(NOW + 300), refreshToken: "a-refresh-token" });

    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 400 })));
    expect(await client().endSession()).toBe(false);

    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("blocked"))));
    expect(await client().endSession()).toBe(false);
    expect(readHeld()).not.toBeNull();
  });

  it("says it could not when nothing is held to end it with", async () => {
    expect(await client().endSession()).toBe(false);
  });

  it("otherwise visits the identity provider to end it, naming the session by its ID token", async () => {
    hold({ token: token(NOW + 300), refreshToken: "refresh", idToken: "id-token" });
    const assign = vi.fn();

    await new RealmIdentityClient(settings, () => NOW, assign).signOut({
      returnTo: "http://localhost:4300/sign-out",
    });

    const address = new URL(assign.mock.calls[0]![0] as string);
    expect(address.origin + address.pathname).toBe(
      "http://idp.example.test/realms/digital-marketplace/protocol/openid-connect/logout",
    );
    expect(Object.fromEntries(address.searchParams)).toEqual({
      client_id: "digital-marketplace-app",
      post_logout_redirect_uri: "http://localhost:4300/sign-out",
      id_token_hint: "id-token",
    });
    expect(readHeld()).toBeNull();
  });
});

describe("beginning sign-in", () => {
  it("sends the browser to the address it is given, at the service", async () => {
    const assign = vi.fn();

    await new RealmIdentityClient(settings, () => NOW, assign).signIn({
      address: "/auth/sign-in?provider=vendor",
    });

    expect(assign).toHaveBeenCalledWith("/auth/sign-in?provider=vendor");
  });
});
