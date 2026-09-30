import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { routeTree } from "../src/router";
import { completeSignIn, signInAddress } from "../src/auth/pkce";
import { readTokens, TOKEN_COOKIE, writeTokens } from "../src/auth/tokens";
import { destinationAfterSignIn } from "../src/screens/auth-callback";
import { isOpenBeforeFinishingSignUp } from "../src/app/root-layout";
import type { User } from "../src/api/users";

const SETTINGS = {
  issuer: "http://localhost:8080/realms/digital-marketplace",
  clientId: "digital-marketplace-app",
};

function account(overrides: Partial<User> = {}): User {
  return {
    id: "00000000-0000-4000-8000-000000000220",
    type: "VENDOR",
    status: "ACTIVE",
    name: "Tatum Placeholder",
    email: "vendor.completing@example.test",
    jobTitle: "",
    avatarImageFile: null,
    notificationsOn: null,
    acceptedTermsAt: null,
    lastAcceptedTermsAt: null,
    idpUsername: "test-vendor-17",
    deactivatedOn: null,
    deactivatedBy: null,
    capabilities: [],
    ...overrides,
  };
}

const AGREED = "2026-01-05T17:00:00.000Z";

function renderAt(address: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [address] }),
  });
  const rendered = render(<RouterProvider router={router as never} />);
  return { router, ...rendered };
}

function signedInBrowser() {
  writeTokens({
    accessToken: "access",
    refreshToken: "refresh",
    idToken: "id",
    expiresAt: Date.now() + 3_600_000,
  });
}

interface Recorded {
  method: string;
  url: string;
  body: string | null;
  authorization: string | null;
}

/** A stand-in for every address the app calls, answering by method and path. */
function serve(
  answers: Record<string, (request: Recorded) => { status: number; body?: unknown }>,
): Recorded[] {
  const calls: Recorded[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(String(input), init);
      const url = new URL(request.url);
      const recorded: Recorded = {
        method: request.method,
        url: url.pathname + url.search,
        body: request.method === "GET" ? null : await request.clone().text(),
        authorization: request.headers.get("authorization"),
      };
      calls.push(recorded);
      const answer = answers[`${request.method} ${url.pathname}`];
      if (!answer) return new Response("", { status: 404 });
      const { status, body } = answer(recorded);
      return new Response(body === undefined ? "" : JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      });
    }),
  );
  return calls;
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  document.cookie = `${TOKEN_COOKIE}=; Path=/api; Max-Age=0`;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("beginning to sign in (decision record 0004)", () => {
  it("sends the browser to the identity provider by PKCE, hinting the identity chosen, with no secret", async () => {
    const address = new URL(await signInAddress("github", "/users/me", SETTINGS));
    const query = address.searchParams;

    expect(address.origin + address.pathname).toBe(
      "http://localhost:8080/realms/digital-marketplace/protocol/openid-connect/auth",
    );
    expect(query.get("client_id")).toBe("digital-marketplace-app");
    expect(query.get("response_type")).toBe("code");
    expect(query.get("kc_idp_hint")).toBe("github");
    expect(query.get("code_challenge_method")).toBe("S256");
    expect(query.get("code_challenge")).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(query.get("redirect_uri")).toBe(`${window.location.origin}/auth/callback`);
    expect(query.has("client_secret")).toBe(false);
  });

  it("keeps a return address inside the service only", async () => {
    await signInAddress("idir", "https://elsewhere.example/", SETTINGS);
    const pending = JSON.parse(window.sessionStorage.getItem("digital-marketplace.sign-in") ?? "{}");

    expect(pending.returnTo).toBeNull();
  });
});

describe("the callback's exchange", () => {
  it("refuses a code that answers no sign-in this browser began", async () => {
    await signInAddress("github", null, SETTINGS);

    expect(await completeSignIn(new URLSearchParams("code=abc&state=forged"))).toEqual({ ok: false });
  });

  it("exchanges the code with the verifier, and keeps the tokens and the cookie", async () => {
    const address = new URL(await signInAddress("github", "/dashboard", SETTINGS));
    const state = address.searchParams.get("state") ?? "";
    // The cookie is scoped to /api, so it is watched being set rather than read back here.
    const cookies = vi.spyOn(Document.prototype, "cookie", "set");
    const calls = serve({
      "GET /app-config.json": () => ({ status: 404 }),
      "POST /realms/digital-marketplace/protocol/openid-connect/token": () => ({
        status: 200,
        body: { access_token: "new-access", refresh_token: "r", id_token: "i", expires_in: 300 },
      }),
    });

    const exchange = await completeSignIn(new URLSearchParams({ code: "abc", state }));

    expect(exchange).toMatchObject({ ok: true, returnTo: "/dashboard" });
    const posted = new URLSearchParams(calls.find((call) => call.method === "POST")?.body ?? "");
    expect(posted.get("grant_type")).toBe("authorization_code");
    expect(posted.get("code_verifier")).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(posted.has("client_secret")).toBe(false);
    expect(readTokens()?.accessToken).toBe("new-access");
    const written = cookies.mock.calls.map(([value]) => String(value));
    cookies.mockRestore();
    expect(written.some((value) => value.startsWith(`${TOKEN_COOKIE}=new-access;`))).toBe(true);
    expect(written.find((value) => value.startsWith(`${TOKEN_COOKIE}=new-access;`))).toMatch(
      /Path=\/api; Max-Age=\d+; SameSite=Strict/,
    );
  });
});

describe("where a person lands after signing in (R-4.22)", () => {
  it("is the profile-completion page for a vendor who has not finished signing up", () => {
    expect(destinationAfterSignIn(account(), null)).toBe("/sign-up/complete");
  });

  it("is the dashboard for a returning person, and for a public sector employee", () => {
    expect(destinationAfterSignIn(account({ lastAcceptedTermsAt: AGREED }), null)).toBe("/dashboard");
    expect(destinationAfterSignIn(account({ type: "GOV" }), null)).toBe("/dashboard");
  });

  it("is the page sign-in began from, when it began from one", () => {
    expect(destinationAfterSignIn(account({ lastAcceptedTermsAt: AGREED }), "/users/me")).toBe(
      "/users/me",
    );
  });

  it("comes out of the callback screen, which signs the person in", async () => {
    const address = new URL(await signInAddress("idir", null, SETTINGS));
    const state = address.searchParams.get("state") ?? "";
    const calls = serve({
      "POST /realms/digital-marketplace/protocol/openid-connect/token": () => ({
        status: 200,
        body: { access_token: "gov-access", expires_in: 300 },
      }),
      "GET /api/sessions/current": () => ({
        status: 200,
        body: { id: "s", user: account({ type: "GOV", idpUsername: "test-gov" }) },
      }),
    });

    const { router } = renderAt(`/auth/callback?code=abc&state=${state}`);

    await waitFor(() => expect(router.state.location.pathname).toBe("/dashboard"));
    const session = calls.find((call) => call.url === "/api/sessions/current");
    expect(session?.authorization).toBe("Bearer gov-access");
    await waitFor(() => expect(screen.getByRole("link", { name: "Sign out" })).toBeTruthy());
  });
});

describe("the sign-in and sign-up screens (R-4.1)", () => {
  it("offer a vendor and a public sector employee each their own way in", async () => {
    renderAt("/sign-in");

    await waitFor(() => expect(screen.getByTestId("sign-in-vendor-card")).toBeTruthy());
    expect(screen.getByTestId("sign-in-public-sector-card")).toBeTruthy();
    expect(screen.getByTestId("sign-in-vendor-button").textContent).toBe("Sign in as a vendor");
    expect(screen.getByTestId("sign-in-public-sector-button")).toBeTruthy();
    expect(screen.getByTestId("sign-in-go-to-sign-up").getAttribute("href")).toBe("/sign-up");
  });

  it("offer the same choice to someone signing up", async () => {
    renderAt("/sign-up");

    await waitFor(() => expect(screen.getByTestId("sign-up-vendor-card")).toBeTruthy());
    expect(screen.getByTestId("sign-up-public-sector-card")).toBeTruthy();
    expect(screen.getByTestId("sign-up-vendor-button")).toBeTruthy();
    expect(screen.getByTestId("sign-up-public-sector-button")).toBeTruthy();
  });
});

describe("finishing signing up (R-4.3, R-4.23, R-4.24, R-4.27, R-4.28)", () => {
  function vendorCompleting(saved: User[] = []) {
    signedInBrowser();
    return serve({
      "GET /api/sessions/current": () => ({ status: 200, body: { id: "s", user: account() } }),
      "PUT /api/users/00000000-0000-4000-8000-000000000220": (request) => {
        const change = JSON.parse(request.body ?? "{}");
        const next = account({
          ...(change.tag === "updateProfile" ? change.value : {}),
          ...(change.tag === "updateNotifications" ? { notificationsOn: AGREED } : {}),
          ...(change.tag === "acceptTerms"
            ? { acceptedTermsAt: AGREED, lastAcceptedTermsAt: AGREED }
            : {}),
        });
        saved.push(next);
        return { status: 200, body: next };
      },
    });
  }

  it("keeps completion unavailable until the terms are agreed, and never asks a vendor for a job title", async () => {
    vendorCompleting();
    renderAt("/sign-up/complete");

    const complete = await screen.findByTestId("sign-up-complete-button");
    expect(complete.hasAttribute("disabled")).toBe(true);
    expect(screen.queryByTestId("job-title-field")).toBeNull();
    expect(within(screen.getByTestId("idp-username-field")).getByRole("textbox")).toHaveProperty(
      "readOnly",
      true,
    );
    expect(
      (within(screen.getByTestId("name-field")).getByRole("textbox") as HTMLInputElement).value,
    ).toBe("Tatum Placeholder");

    fireEvent.click(within(screen.getByTestId("sign-up-terms-checkbox")).getByRole("checkbox"));

    await waitFor(() => expect(complete.hasAttribute("disabled")).toBe(false));
  });

  it("reports each invalid field and saves nothing", async () => {
    const calls = vendorCompleting();
    renderAt("/sign-up/complete");
    await screen.findByTestId("sign-up-complete-button");

    fireEvent.change(within(screen.getByTestId("name-field")).getByRole("textbox"), {
      target: { value: "" },
    });
    fireEvent.change(within(screen.getByTestId("email-field")).getByRole("textbox"), {
      target: { value: "vendor1-at-example" },
    });
    fireEvent.click(within(screen.getByTestId("sign-up-terms-checkbox")).getByRole("checkbox"));
    fireEvent.click(screen.getByTestId("sign-up-complete-button"));

    await waitFor(() => expect(screen.getAllByTestId("field-error")).toHaveLength(2));
    expect(screen.getByRole("alert").textContent).toContain("Your profile has 2 problems");
    expect(calls.some((call) => call.method === "PUT")).toBe(false);
  });

  it("records the details, the notice choice and the agreement, then goes on to the dashboard", async () => {
    const saved: User[] = [];
    const calls = vendorCompleting(saved);
    const { router } = renderAt("/sign-up/complete");
    await screen.findByTestId("sign-up-complete-button");

    fireEvent.click(within(screen.getByTestId("sign-up-notifications-checkbox")).getByRole("checkbox"));
    fireEvent.click(within(screen.getByTestId("sign-up-terms-checkbox")).getByRole("checkbox"));
    fireEvent.click(screen.getByTestId("sign-up-complete-button"));

    await waitFor(() => expect(router.state.location.pathname).toBe("/dashboard"));
    const changes = calls
      .filter((call) => call.method === "PUT")
      .map((call) => JSON.parse(call.body ?? "{}"));
    expect(changes).toEqual([
      {
        tag: "updateProfile",
        value: { name: "Tatum Placeholder", email: "vendor.completing@example.test", jobTitle: "" },
      },
      { tag: "updateNotifications", value: true },
      { tag: "acceptTerms" },
    ]);
  });

  it("asks nothing about notices when the box is left unticked", async () => {
    const calls = vendorCompleting();
    const { router } = renderAt("/sign-up/complete");
    await screen.findByTestId("sign-up-complete-button");

    fireEvent.click(within(screen.getByTestId("sign-up-terms-checkbox")).getByRole("checkbox"));
    fireEvent.click(screen.getByTestId("sign-up-complete-button"));

    await waitFor(() => expect(router.state.location.pathname).toBe("/dashboard"));
    const tags = calls
      .filter((call) => call.method === "PUT")
      .map((call) => JSON.parse(call.body ?? "{}").tag);
    expect(tags).toEqual(["updateProfile", "acceptTerms"]);
  });

  it("says the profile could not be saved, without a cause, and keeps what was entered", async () => {
    signedInBrowser();
    serve({
      "GET /api/sessions/current": () => ({ status: 200, body: { id: "s", user: account() } }),
      "PUT /api/users/00000000-0000-4000-8000-000000000220": () => ({
        status: 400,
        body: { errors: ["Your profile could not be saved."] },
      }),
    });
    renderAt("/sign-up/complete");
    await screen.findByTestId("sign-up-complete-button");

    fireEvent.change(within(screen.getByTestId("email-field")).getByRole("textbox"), {
      target: { value: "vendor.one@example.test" },
    });
    fireEvent.click(within(screen.getByTestId("sign-up-terms-checkbox")).getByRole("checkbox"));
    fireEvent.click(screen.getByTestId("sign-up-complete-button"));

    await waitFor(() => expect(screen.getByText("Your profile could not be saved")).toBeTruthy());
    expect(
      (within(screen.getByTestId("email-field")).getByRole("textbox") as HTMLInputElement).value,
    ).toBe("vendor.one@example.test");
  });

  it("moves a vendor who agreed before, and a public sector employee, straight on to the dashboard", async () => {
    for (const user of [account({ lastAcceptedTermsAt: AGREED }), account({ type: "GOV" })]) {
      signedInBrowser();
      serve({ "GET /api/sessions/current": () => ({ status: 200, body: { id: "s", user } }) });
      const { router, unmount } = renderAt("/sign-up/complete");

      await waitFor(() => expect(router.state.location.pathname).toBe("/dashboard"));
      unmount();
    }
  });

  it("sends a visitor who is not signed in to sign in, and back here afterwards", async () => {
    const { router } = renderAt("/sign-up/complete");

    await waitFor(() => expect(router.state.location.pathname).toBe("/sign-in"));
    expect(router.state.location.search).toEqual({ redirectOnSuccess: "/sign-up/complete" });
  });

  it("is where every other screen sends a vendor who has not finished", async () => {
    vendorCompleting();
    const { router } = renderAt("/learn-more/code-with-us");

    await waitFor(() => expect(router.state.location.pathname).toBe("/sign-up/complete"));
    expect(router.state.location.search).toEqual({ redirectOnSuccess: "/learn-more/code-with-us" });
  });

  it("leaves the terms and privacy pages open to that vendor", () => {
    expect(isOpenBeforeFinishingSignUp("/content/terms-and-conditions")).toBe(true);
    expect(isOpenBeforeFinishingSignUp("/sign-out")).toBe(true);
    expect(isOpenBeforeFinishingSignUp("/dashboard")).toBe(false);
    expect(isOpenBeforeFinishingSignUp("/")).toBe(false);
  });
});

describe("the dashboard", () => {
  it("sends a visitor who is not signed in to sign in, to come back to it (R-4.22)", async () => {
    const { router } = renderAt("/dashboard");

    await waitFor(() => expect(router.state.location.pathname).toBe("/sign-in"));
    expect(router.state.location.search).toEqual({ redirectOnSuccess: "/dashboard" });
  });
});

describe("signing out (R-4.17)", () => {
  it("tells a person with no session that they are signed out", async () => {
    renderAt("/sign-out");

    expect(await screen.findByTestId("sign-out-success")).toBeTruthy();
    expect(screen.getByText("You have successfully signed out")).toBeTruthy();
  });

  it("says so when the service could not end the session, and keeps the person signed in", async () => {
    signedInBrowser();
    serve({
      "GET /api/sessions/current": () => ({
        status: 200,
        body: { id: "s", user: account({ lastAcceptedTermsAt: AGREED }) },
      }),
      "DELETE /api/sessions/current": () => ({ status: 500, body: { errors: ["x"] } }),
    });
    renderAt("/sign-out");

    expect(await screen.findByTestId("sign-out-failed")).toBeTruthy();
    expect(readTokens()).not.toBeNull();
  });
});

describe("the notices (R-4.4)", () => {
  it("shows the sign-in failure notice by name", async () => {
    renderAt("/notice/authFailure");

    expect(await screen.findByTestId("notice-sign-in-failed")).toBeTruthy();
    expect(screen.getByTestId("notice-back-to-home").getAttribute("href")).toBe("/");
  });

  it("answers any other name as a page that does not exist", async () => {
    renderAt("/notice/somethingElse");

    expect(await screen.findByTestId("not-found-page")).toBeTruthy();
  });
});

describe("the screens this slice adds, for what a machine can check of WCAG 2.1 AA", () => {
  async function problemsIn(container: HTMLElement): Promise<string[]> {
    const results = await axe.run(container, {
      resultTypes: ["violations"],
      rules: { "color-contrast": { enabled: false } },
    });
    return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
  }

  it.each([
    ["/sign-in", "sign-in-vendor-card"],
    ["/sign-up", "sign-up-vendor-card"],
    ["/notice/authFailure", "notice-sign-in-failed"],
    ["/sign-out", "sign-out-success"],
  ])("has nothing to answer for on %s", async (address, testId) => {
    const { container } = renderAt(address);
    await screen.findByTestId(testId);

    expect(await problemsIn(container)).toEqual([]);
  }, 30_000);

  it("has nothing to answer for on the profile-completion form", async () => {
    signedInBrowser();
    serve({ "GET /api/sessions/current": () => ({ status: 200, body: { id: "s", user: account() } }) });
    const { container } = renderAt("/sign-up/complete");
    await screen.findByTestId("sign-up-complete-button");

    expect(await problemsIn(container)).toEqual([]);
  }, 30_000);
});
