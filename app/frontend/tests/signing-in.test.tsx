import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from "@tanstack/react-router";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Account } from "../src/api/accounts";
import type { IdentityClient } from "../src/auth/identity-client";
import {
  currentSession,
  resetSessionForTests,
  startSession,
} from "../src/auth/session";
import { routeTree } from "../src/router";

/**
 * Signing in, finishing signing up and signing out, as the screens do them. The identity
 * provider is stood in for, and so is the service: what is checked is what the screens ask
 * of each, and where they take the person.
 */

const ORIGIN = window.location.origin;

function account(overrides: Partial<Account> = {}): Account {
  return {
    id: "00000000-0000-4000-8000-000000000220",
    type: "VENDOR",
    status: "ACTIVE",
    name: "Tatum Placeholder",
    email: "vendor.completing@example.test",
    jobTitle: null,
    avatarImageFile: null,
    notificationsOn: null,
    acceptedTermsAt: null,
    lastAcceptedTermsAt: null,
    idpUsername: "test-vendor-17",
    ...overrides,
  };
}

const unfinishedVendor = account();
const agreedVendor = account({
  id: "00000000-0000-4000-8000-000000000201",
  name: "Alex Placeholder",
  idpUsername: "test-vendor-1",
  acceptedTermsAt: "2026-01-05T17:00:00.000Z",
  lastAcceptedTermsAt: "2026-01-05T17:00:00.000Z",
});
const staff = account({
  id: "00000000-0000-4000-8000-000000000102",
  type: "GOV",
  name: "Casey Placeholder",
  idpUsername: "test-gov",
});

function fakeIdentity(signedIn = true, endsSessionFromThePage = true) {
  return {
    start: vi.fn(async () => signedIn),
    signIn: vi.fn(async () => {}),
    endSession: vi.fn(async () => endsSessionFromThePage),
    signOut: vi.fn(async () => {}),
    accessToken: vi.fn(async () => (signedIn ? "a-token" : null)),
    forget: vi.fn(),
  } satisfies IdentityClient;
}

type Handler = (request: Request) => Promise<Response> | Response;
const requests: { method: string; path: string; body: unknown; authorization: string | null }[] = [];

function serve(handler: Handler) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: Request) => {
      const text = input.method === "GET" || input.method === "DELETE" ? "" : await input.clone().text();
      requests.push({
        method: input.method,
        path: new URL(input.url).pathname,
        body: text ? JSON.parse(text) : undefined,
        authorization: input.headers.get("authorization"),
      });
      return handler(input);
    }),
  );
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function renderAt(address: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [address] }),
  });
  const view = render(<RouterProvider router={router as never} />);
  return { ...view, router };
}

const where = (router: ReturnType<typeof renderAt>["router"]) => router.state.location.href;

beforeEach(() => {
  requests.length = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetSessionForTests();
});

describe("finding out who is using the app", () => {
  it("is a visitor when the identity provider holds no sign-in", async () => {
    serve(() => json(200, { id: null, user: null }));
    await startSession(fakeIdentity(false));

    expect(currentSession()).toEqual({ status: "visitor" });
    expect(requests).toEqual([]);
  });

  it("asks the service for the account with the person's token, which completes sign-in", async () => {
    serve(() => json(200, { id: "s", user: agreedVendor }));
    await startSession(fakeIdentity());

    expect(currentSession()).toEqual({ status: "signed-in", account: agreedVendor });
    expect(requests).toEqual([
      { method: "GET", path: "/api/sessions/current", body: undefined, authorization: "Bearer a-token" },
    ]);
  });

  it("is a refused sign-in when the service will not have the account (R-4.4)", async () => {
    serve(() => json(403, { errors: ["We could not sign you in."] }));
    await startSession(fakeIdentity());

    expect(currentSession()).toEqual({ status: "refused" });
  });

  it("is a visitor again when the service no longer accepts the token", async () => {
    const identity = fakeIdentity();
    serve(() => json(401, { errors: ["Sign in to do that."] }));
    await startSession(identity);

    expect(currentSession()).toEqual({ status: "visitor" });
    expect(identity.forget).toHaveBeenCalled();
  });
});

describe("Sign In (user-sign-in)", () => {
  it("offers both ways in, and the way to sign up", async () => {
    resetSessionForTests({ status: "visitor" }, fakeIdentity(false));
    renderAt("/sign-in");

    await screen.findByRole("heading", { level: 1, name: "Sign In" });
    for (const id of [
      "sign-in-vendor-card",
      "sign-in-vendor-button",
      "sign-in-public-sector-card",
      "sign-in-public-sector-button",
      "sign-in-go-to-sign-up",
    ]) {
      expect(screen.getByTestId(id), id).toBeTruthy();
    }
    expect(screen.getByTestId("sign-in-go-to-sign-up").getAttribute("href")).toBe("/sign-up");
  });

  it("goes to the identity provider, to come back to the page sign-in began from (R-4.22)", async () => {
    const identity = fakeIdentity(false);
    resetSessionForTests({ status: "visitor" }, identity);
    renderAt("/sign-in?redirectOnSuccess=%2Fdashboard");

    fireEvent.click(await screen.findByTestId("sign-in-vendor-button"));

    await waitFor(() =>
      expect(identity.signIn).toHaveBeenCalledWith({
        returnTo: `${ORIGIN}/auth/callback?redirectOnSuccess=%2Fdashboard`,
        hint: undefined,
      }),
    );
  });

  it("never carries a return address that leads off the service", async () => {
    const identity = fakeIdentity(false);
    resetSessionForTests({ status: "visitor" }, identity);
    renderAt("/sign-in?redirectOnSuccess=https%3A%2F%2Felsewhere.example");

    fireEvent.click(await screen.findByTestId("sign-in-public-sector-button"));

    await waitFor(() =>
      expect(identity.signIn).toHaveBeenCalledWith({ returnTo: `${ORIGIN}/auth/callback`, hint: undefined }),
    );
  });

  it("sends somebody already signed in on to their dashboard", async () => {
    resetSessionForTests({ status: "signed-in", account: agreedVendor }, fakeIdentity());
    const { router } = renderAt("/sign-in");

    await waitFor(() => expect(where(router)).toBe("/dashboard"));
  });
});

describe("Choose Account Type (user-sign-up-choose-account)", () => {
  it("offers both kinds of account, each signing in the way that makes it (R-4.1)", async () => {
    const identity = fakeIdentity(false);
    resetSessionForTests({ status: "visitor" }, identity);
    renderAt("/sign-up");

    await screen.findByRole("heading", { level: 1, name: "Choose Account Type" });
    for (const id of [
      "sign-up-vendor-card",
      "sign-up-vendor-button",
      "sign-up-public-sector-card",
      "sign-up-public-sector-button",
    ]) {
      expect(screen.getByTestId(id), id).toBeTruthy();
    }
    fireEvent.click(screen.getByTestId("sign-up-public-sector-button"));
    await waitFor(() => expect(identity.signIn).toHaveBeenCalledTimes(1));
  });
});

describe("coming back from the identity provider (R-4.22)", () => {
  it("takes a returning person to their dashboard", async () => {
    resetSessionForTests({ status: "signed-in", account: agreedVendor }, fakeIdentity());
    const { router } = renderAt("/auth/callback");

    await waitFor(() => expect(where(router)).toBe("/dashboard"));
  });

  it("takes a vendor whose account was just made to the profile-completion page", async () => {
    resetSessionForTests({ status: "signed-in", account: unfinishedVendor }, fakeIdentity());
    const { router } = renderAt("/auth/callback");

    await waitFor(() => expect(where(router)).toBe("/sign-up/complete"));
  });

  it("takes a public sector employee whose account was just made to their dashboard (R-4.23)", async () => {
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    const { router } = renderAt("/auth/callback");

    await waitFor(() => expect(where(router)).toBe("/dashboard"));
  });

  it("returns a person to the page sign-in began from", async () => {
    resetSessionForTests({ status: "signed-in", account: agreedVendor }, fakeIdentity());
    const { router } = renderAt("/auth/callback?redirectOnSuccess=%2Fcontent%2Fabout-us");

    await waitFor(() => expect(where(router)).toBe("/content/about-us"));
  });

  it("shows the sign-in failure notice when there was no sign-in to complete", async () => {
    resetSessionForTests({ status: "visitor" }, fakeIdentity(false));
    const { router } = renderAt("/auth/callback");

    await waitFor(() => expect(where(router)).toBe("/notice/authFailure"));
  });

  it("ends a sign-in the service refused at the identity provider too, landing on the notice (R-4.4)", async () => {
    const identity = fakeIdentity();
    resetSessionForTests({ status: "refused" }, identity);
    renderAt("/auth/callback");

    await waitFor(() =>
      expect(identity.signOut).toHaveBeenCalledWith({ returnTo: `${ORIGIN}/notice/authFailure` }),
    );
  });

  it("begins sign-in at /auth/sign-in, with the hint and the return address it names", async () => {
    const identity = fakeIdentity(false);
    resetSessionForTests({ status: "visitor" }, identity);
    renderAt("/auth/sign-in?provider=github&redirectOnSuccess=%2Fdashboard");

    await waitFor(() =>
      expect(identity.signIn).toHaveBeenCalledWith({
        returnTo: `${ORIGIN}/auth/callback?redirectOnSuccess=%2Fdashboard`,
        hint: "github",
      }),
    );
  });
});

describe("Complete Your Profile (user-sign-up-complete)", () => {
  it("sends a visitor to sign in (R-4.23)", async () => {
    resetSessionForTests({ status: "visitor" }, fakeIdentity(false));
    const { router } = renderAt("/sign-up/complete");

    await waitFor(() => expect(router.state.location.pathname).toBe("/sign-in"));
  });

  it("moves a public sector employee and a vendor who agreed before straight on to the dashboard (R-4.23)", async () => {
    for (const person of [staff, agreedVendor, { ...agreedVendor, acceptedTermsAt: null }]) {
      resetSessionForTests({ status: "signed-in", account: person }, fakeIdentity());
      const { router, unmount } = renderAt("/sign-up/complete");
      await waitFor(() => expect(where(router)).toBe("/dashboard"));
      unmount();
    }
  });

  it("keeps completion unavailable until the terms are agreed to (R-4.3)", async () => {
    resetSessionForTests({ status: "signed-in", account: unfinishedVendor }, fakeIdentity());
    renderAt("/sign-up/complete");

    const complete = await screen.findByTestId("sign-up-complete-button");
    expect(complete.hasAttribute("disabled")).toBe(true);
    expect(screen.getByText(/Agree to the terms and conditions and the privacy policy to complete/)).toBeTruthy();

    fireEvent.click(screen.getByRole("checkbox", { name: /I have read and agree/ }));

    await waitFor(() => expect(complete.hasAttribute("disabled")).toBe(false));
    expect(screen.getByTestId("sign-up-terms-checkbox")).toBeTruthy();
  });

  it("shows the sign-in username read-only, never asks a vendor for a job title (R-4.27, R-4.28)", async () => {
    resetSessionForTests({ status: "signed-in", account: unfinishedVendor }, fakeIdentity());
    renderAt("/sign-up/complete");

    const username = (await screen.findByRole("textbox", { name: "Sign-in username" })) as HTMLInputElement;
    expect(username.value).toBe("test-vendor-17");
    expect(username.readOnly).toBe(true);
    expect(within(screen.getByTestId("idp-username-field")).getByRole("textbox")).toBe(username);
    expect(screen.queryByTestId("job-title-field")).toBeNull();
    expect(screen.queryByRole("textbox", { name: /Job title/ })).toBeNull();
    for (const id of ["name-field", "email-field", "change-avatar", "sign-up-notifications-checkbox"]) {
      expect(screen.getByTestId(id), id).toBeTruthy();
    }
    expect(
      (screen.getByRole("textbox", { name: /Name/ }) as HTMLInputElement).value,
    ).toBe("Tatum Placeholder");
  });

  it("reports an empty name and a malformed email address against their fields, and saves nothing (R-4.27)", async () => {
    serve(() => json(500, {}));
    resetSessionForTests({ status: "signed-in", account: unfinishedVendor }, fakeIdentity());
    renderAt("/sign-up/complete");

    fireEvent.change(await screen.findByRole("textbox", { name: /Name/ }), { target: { value: "" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Email address/ }), {
      target: { value: "vendor1-at-example" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /I have read and agree/ }));
    await waitFor(() => expect(screen.getByTestId("sign-up-complete-button").hasAttribute("disabled")).toBe(false));
    fireEvent.click(screen.getByTestId("sign-up-complete-button"));

    await waitFor(() => expect(screen.getAllByTestId("field-error")).toHaveLength(2));
    const alerts = screen.getAllByRole("alert").map((alert) => alert.textContent ?? "");
    expect(alerts.some((text) => text.includes("Your profile has 2 problems")), alerts.join(" | ")).toBe(true);
    expect(requests).toEqual([]);
  });

  it("saves the details, the notice choice and the agreement, then goes to the dashboard (R-4.3, R-4.24)", async () => {
    const finished = { ...unfinishedVendor, acceptedTermsAt: "2026-09-30T00:00:00.000Z", lastAcceptedTermsAt: "2026-09-30T00:00:00.000Z" };
    serve(async (request) => {
      const body = JSON.parse(await request.clone().text());
      if (body.tag === "acceptTerms") return json(200, finished);
      return json(200, unfinishedVendor);
    });
    resetSessionForTests({ status: "signed-in", account: unfinishedVendor }, fakeIdentity());
    const { router } = renderAt("/sign-up/complete");

    fireEvent.change(await screen.findByRole("textbox", { name: /Email address/ }), {
      target: { value: "Tatum@Example.test" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /Email me when new opportunities are posted/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /I have read and agree/ }));
    await waitFor(() => expect(screen.getByTestId("sign-up-complete-button").hasAttribute("disabled")).toBe(false));
    fireEvent.click(screen.getByTestId("sign-up-complete-button"));

    await waitFor(() => expect(where(router)).toBe("/dashboard"));
    expect(requests.map(({ method, path, body }) => ({ method, path, body }))).toEqual([
      {
        method: "PUT",
        path: `/api/users/${unfinishedVendor.id}`,
        body: { tag: "updateProfile", value: { name: "Tatum Placeholder", email: "tatum@example.test" } },
      },
      { method: "PUT", path: `/api/users/${unfinishedVendor.id}`, body: { tag: "updateNotifications", value: true } },
      { method: "PUT", path: `/api/users/${unfinishedVendor.id}`, body: { tag: "acceptTerms" } },
    ]);
    expect(currentSession()).toEqual({ status: "signed-in", account: finished });
  });

  it("does not ask for notices when the box is left unticked (R-6.20)", async () => {
    serve(() => json(200, { ...unfinishedVendor, acceptedTermsAt: "2026-09-30T00:00:00.000Z" }));
    resetSessionForTests({ status: "signed-in", account: unfinishedVendor }, fakeIdentity());
    renderAt("/sign-up/complete");

    fireEvent.click(await screen.findByRole("checkbox", { name: /I have read and agree/ }));
    await waitFor(() => expect(screen.getByTestId("sign-up-complete-button").hasAttribute("disabled")).toBe(false));
    fireEvent.click(screen.getByTestId("sign-up-complete-button"));

    await waitFor(() => expect(requests).toHaveLength(2));
    expect(requests.map((request) => (request.body as { tag: string }).tag)).toEqual([
      "updateProfile",
      "acceptTerms",
    ]);
  });

  it("says the profile could not be saved, without saying why, and keeps what was entered (R-4.6)", async () => {
    serve(() => json(400, { errors: ["Your profile could not be saved."] }));
    resetSessionForTests({ status: "signed-in", account: unfinishedVendor }, fakeIdentity());
    const { router } = renderAt("/sign-up/complete");

    fireEvent.change(await screen.findByRole("textbox", { name: /Email address/ }), {
      target: { value: "vendor.one@example.test" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /I have read and agree/ }));
    await waitFor(() => expect(screen.getByTestId("sign-up-complete-button").hasAttribute("disabled")).toBe(false));
    fireEvent.click(screen.getByTestId("sign-up-complete-button"));

    await screen.findByText("Your profile could not be saved");
    expect(where(router)).toBe("/sign-up/complete");
    expect((screen.getByRole("textbox", { name: /Email address/ }) as HTMLInputElement).value).toBe(
      "vendor.one@example.test",
    );
    expect(requests).toHaveLength(1);
  });
});

describe("a vendor who has not finished signing up", () => {
  it("is sent to finish it from any other screen", async () => {
    resetSessionForTests({ status: "signed-in", account: unfinishedVendor }, fakeIdentity());
    const { router } = renderAt("/dashboard");

    await waitFor(() => expect(where(router)).toBe("/sign-up/complete"));
  });

  it("may still read the terms and the privacy policy", async () => {
    serve(() => json(200, {
      id: "x", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
      slug: "privacy", title: "privacy", body: "Initial version", fixed: true,
    }));
    resetSessionForTests({ status: "signed-in", account: unfinishedVendor }, fakeIdentity());
    const { router } = renderAt("/content/privacy");

    await screen.findByTestId("content-page");
    expect(where(router)).toBe("/content/privacy");
  });
});

describe("the dashboard", () => {
  it("sends a visitor to sign in, to come back to it (R-4.17, R-4.22)", async () => {
    resetSessionForTests({ status: "visitor" }, fakeIdentity(false));
    const { router } = renderAt("/dashboard");

    await waitFor(() => expect(where(router)).toBe("/sign-in?redirectOnSuccess=%2Fdashboard"));
  });

  it("is where a signed-in person is", async () => {
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/dashboard");

    await screen.findByRole("heading", { level: 1, name: "Dashboard" });
    expect(screen.getByText(/Casey Placeholder/)).toBeTruthy();
  });
});

describe("Signed Out (user-sign-out, R-4.17)", () => {
  it("ends the session with the service, then with the identity provider, and only then says so", async () => {
    const identity = fakeIdentity();
    let answerTheService: () => void = () => {};
    serve(
      () =>
        new Promise<Response>((resolve) => {
          answerTheService = () => resolve(json(200, { id: "s", user: null }));
        }),
    );
    resetSessionForTests({ status: "signed-in", account: agreedVendor }, identity);
    renderAt("/sign-out");

    await screen.findByRole("heading", { level: 1, name: "Signing Out" });
    await waitFor(() => expect(requests).toHaveLength(1));
    expect(identity.endSession).not.toHaveBeenCalled();
    expect(screen.queryByTestId("sign-out-success")).toBeNull();

    act(() => answerTheService());

    await screen.findByTestId("sign-out-success");
    expect(requests.map(({ method, path }) => `${method} ${path}`)).toEqual(["DELETE /api/sessions/current"]);
    expect(identity.endSession).toHaveBeenCalledTimes(1);
    expect(identity.signOut).not.toHaveBeenCalled();
    expect(currentSession()).toEqual({ status: "visitor" });
  });

  it("goes to the identity provider when it cannot end the session from the page, and says nothing yet", async () => {
    const identity = fakeIdentity(true, false);
    serve(() => json(200, { id: "s", user: null }));
    resetSessionForTests({ status: "signed-in", account: agreedVendor }, identity);
    renderAt("/sign-out");

    await waitFor(() => expect(identity.signOut).toHaveBeenCalledWith({ returnTo: `${ORIGIN}/sign-out` }));
    expect(screen.queryByTestId("sign-out-success")).toBeNull();
    expect(screen.getByRole("heading", { level: 1, name: "Signing Out" })).toBeTruthy();
  });

  it("ends a refused sign-in's identity-provider session without asking the service", async () => {
    const identity = fakeIdentity();
    serve(() => json(500, {}));
    resetSessionForTests({ status: "refused" }, identity);
    renderAt("/sign-out");

    await screen.findByTestId("sign-out-success");
    expect(requests).toEqual([]);
    expect(identity.endSession).toHaveBeenCalled();
  });

  it("tells the person they have signed out", async () => {
    resetSessionForTests({ status: "visitor" }, fakeIdentity(false));
    renderAt("/sign-out");

    const done = await screen.findByTestId("sign-out-success");
    expect(done.textContent).toContain("You have successfully signed out");
    expect(screen.getByRole("heading", { level: 1, name: "Signed Out" })).toBeTruthy();
  });

  it("tells the person when it could not be done, and signs nothing out", async () => {
    const identity = fakeIdentity();
    serve(() => json(500, { errors: ["The service could not answer."] }));
    resetSessionForTests({ status: "signed-in", account: agreedVendor }, identity);
    renderAt("/sign-out");

    await screen.findByTestId("sign-out-failed");
    expect(identity.endSession).not.toHaveBeenCalled();
    expect(identity.signOut).not.toHaveBeenCalled();
    expect(currentSession().status).toBe("signed-in");
  });
});

describe("Notice (user-notice)", () => {
  it("says sign-in failed, naming no cause", async () => {
    renderAt("/notice/authFailure");

    const notice = await screen.findByTestId("notice-sign-in-failed");
    expect(notice.textContent).toContain("We could not sign you in. Please try again.");
    expect(screen.getByTestId("notice-back-to-home").getAttribute("href")).toBe("/");
  });

  it("confirms a person's own deactivation", async () => {
    renderAt("/notice/deactivatedOwnAccount");

    expect((await screen.findByTestId("notice-deactivated-own-account")).textContent).toContain(
      "by signing in again",
    );
  });

  it("answers any other name as not found", async () => {
    renderAt("/notice/somethingElse");

    await screen.findByTestId("not-found-page");
  });
});

describe("the banner", () => {
  it("offers a visitor the way in", async () => {
    resetSessionForTests({ status: "visitor" }, fakeIdentity(false));
    renderAt("/");

    const banner = await screen.findByTestId("site-header");
    expect(within(banner).getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe("/sign-in");
    expect(within(banner).queryByRole("link", { name: "Sign out" })).toBeNull();
  });

  it("offers somebody signed in the way out", async () => {
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/");

    const banner = await screen.findByTestId("site-header");
    expect(within(banner).getByRole("link", { name: "Sign out" }).getAttribute("href")).toBe("/sign-out");
  });
});

async function problemsIn(container: HTMLElement): Promise<string[]> {
  const results = await axe.run(container, {
    resultTypes: ["violations"],
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
}

describe("the screens this slice adds have nothing to answer for (P1)", () => {
  const screens: [string, () => void, string][] = [
    ["/sign-in", () => resetSessionForTests({ status: "visitor" }, fakeIdentity(false)), "Sign In"],
    ["/sign-up", () => resetSessionForTests({ status: "visitor" }, fakeIdentity(false)), "Choose Account Type"],
    [
      "/sign-up/complete",
      () => resetSessionForTests({ status: "signed-in", account: unfinishedVendor }, fakeIdentity()),
      "Complete Your Profile",
    ],
    ["/sign-out", () => resetSessionForTests({ status: "visitor" }, fakeIdentity(false)), "Signed Out"],
    ["/notice/authFailure", () => resetSessionForTests({ status: "visitor" }, fakeIdentity(false)), "Sign in failed"],
  ];

  for (const [address, arrange, heading] of screens) {
    it(`on ${address}`, async () => {
      arrange();
      const { container } = renderAt(address);
      await screen.findByRole("heading", { level: 1, name: heading });
      await act(async () => {});

      expect(await problemsIn(container)).toEqual([]);
    }, 30_000);
  }
});
