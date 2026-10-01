import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { carriesTermsAnnouncement } from "@rules/content";
import type { Account } from "../src/api/accounts";
import type { IdentityClient } from "../src/auth/identity-client";
import { resetSessionForTests } from "../src/auth/session";
import { routeTree } from "../src/router";

/**
 * An administrator announcing changed terms from the terms page's managing screen
 * (notification-terms-broadcast), and a vendor agreeing to them again on their legal section
 * (user-profile-legal). The service is stood in for.
 */

function account(overrides: Partial<Account>): Account {
  return {
    id: "00000000-0000-4000-8000-000000000201",
    type: "VENDOR",
    status: "ACTIVE",
    name: "Alex Placeholder",
    email: "vendor.one@example.test",
    jobTitle: null,
    avatarImageFile: null,
    notificationsOn: null,
    acceptedTermsAt: "2026-09-01T10:30:00.000Z",
    lastAcceptedTermsAt: "2026-09-01T10:30:00.000Z",
    idpUsername: "test-vendor-1",
    capabilities: [],
    deactivatedOn: null,
    deactivatedBy: null,
    ...overrides,
  };
}

const administrator = account({ id: "00000000-0000-4000-8000-000000000101", type: "ADMIN", name: "Robin Placeholder" });
const staff = account({ id: "00000000-0000-4000-8000-000000000102", type: "GOV", acceptedTermsAt: null, lastAcceptedTermsAt: null });
const withdrawn = account({ acceptedTermsAt: null });

function fakeIdentity() {
  return {
    start: vi.fn(() => true),
    signIn: vi.fn(async () => {}),
    endSession: vi.fn(async () => true),
    signOut: vi.fn(async () => {}),
    accessToken: vi.fn(async () => "a-token"),
    forget: vi.fn(),
  } satisfies IdentityClient;
}

const page = (slug: string) => ({
  id: "00000000-0000-4000-8000-000000000560",
  createdAt: "2020-12-02T17:00:00.000Z",
  updatedAt: "2020-12-02T17:00:00.000Z",
  slug,
  title: slug,
  body: "Initial version",
  fixed: true,
  createdBy: null,
  updatedBy: null,
});

const requests: { method: string; path: string; body: unknown }[] = [];

function serve(handler: (method: string, path: string) => Response) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: Request) => {
      const type = input.headers.get("content-type") ?? "";
      const body = type.includes("application/json") ? JSON.parse(await input.clone().text()) : undefined;
      const path = new URL(input.url).pathname;
      requests.push({ method: input.method, path, body });
      return handler(input.method, path);
    }),
  );
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function renderAt(address: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [address] }) });
  return render(<RouterProvider router={router as never} />);
}

beforeEach(() => {
  requests.length = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetSessionForTests();
});

describe("which page carries the announcement (R-7.13)", () => {
  it("is the service's own terms and conditions page alone", () => {
    expect(carriesTermsAnnouncement("terms-and-conditions")).toBe(true);
    for (const slug of ["about", "privacy", "code-with-us-terms-and-conditions", "terms-and-conditions-2"]) {
      expect(carriesTermsAnnouncement(slug), slug).toBe(false);
    }
  });

  it("is offered on the terms page's managing screen, and on no other", async () => {
    serve((_method, path) => json(200, page(path.split("/").pop() as string)));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    const terms = renderAt("/content/terms-and-conditions/edit");
    expect(await screen.findByTestId("notify-vendors-button")).toBeTruthy();
    expect(screen.getByText(/Code With Us, Sprint With Us or Team With Us/)).toBeTruthy();
    terms.unmount();

    renderAt("/content/code-with-us-terms-and-conditions/edit");
    await screen.findByTestId("content-edit-button");
    expect(screen.queryByTestId("notify-vendors-button")).toBeNull();
  });

  it("is not offered to anybody but an administrator", async () => {
    serve(() => json(200, page("terms-and-conditions")));
    for (const who of [account({}), staff]) {
      resetSessionForTests({ status: "signed-in", account: who }, fakeIdentity());
      const view = renderAt("/content/terms-and-conditions/edit");
      await screen.findByTestId("not-found-page");
      expect(screen.queryByTestId("notify-vendors-button")).toBeNull();
      view.unmount();
    }
  });
});

describe("announcing changed terms (R-6.23, R-6.24)", () => {
  async function openQuestion(answer: Response) {
    serve((method, path) =>
      method === "POST" && path === "/api/emailNotifications" ? answer : json(200, page("terms-and-conditions")),
    );
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt("/content/terms-and-conditions/edit");
    fireEvent.click(await screen.findByTestId("notify-vendors-button"));
    return screen.findByTestId("notify-vendors-dialog");
  }

  it("asks first, and sends nothing when the administrator cancels", async () => {
    const dialog = await openQuestion(json(200, {}));
    expect(dialog.textContent).toContain("Every vendor's acceptance of the terms and conditions will be withdrawn");
    fireEvent.click(screen.getByTestId("notify-vendors-cancel-button"));
    await waitFor(() => expect(screen.queryByTestId("notify-vendors-dialog")).toBeNull());
    expect(requests.filter((request) => request.method === "POST")).toEqual([]);
  });

  it("announces once confirmed, and says the emails are on their way", async () => {
    await openQuestion(json(200, { tag: "updateTerms", withdrawn: 7 }));
    fireEvent.click(screen.getByTestId("notify-vendors-confirm-button"));

    const success = await screen.findByTestId("notify-vendors-success");
    expect(success.textContent).toContain("Vendors have been notified");
    expect(success.textContent).toContain("will not report whether each email arrives");
    expect(requests.filter((request) => request.method === "POST")).toEqual([
      { method: "POST", path: "/api/emailNotifications", body: { tag: "updateTerms" } },
    ]);
    expect(screen.queryByTestId("notify-vendors-dialog")).toBeNull();
  });

  it("says so when the service refuses, and offers it again", async () => {
    await openQuestion(json(400, { errors: ["Only an administrator may announce changed terms."] }));
    fireEvent.click(screen.getByTestId("notify-vendors-confirm-button"));

    expect((await screen.findByTestId("notify-vendors-failure")).textContent).toContain("Vendors have not been notified");
    expect(screen.queryByTestId("notify-vendors-success")).toBeNull();
    expect(screen.getByTestId("notify-vendors-button")).toBeTruthy();
  });
});

describe("the legal section (R-4.33)", () => {
  it("sets out the privacy policy, the terms with when they were agreed to, and the three programs' terms", async () => {
    resetSessionForTests({ status: "signed-in", account: account({}) }, fakeIdentity());
    renderAt("/users/me?tab=legal");

    expect(await screen.findByRole("heading", { level: 1, name: "Policies, Terms & Agreements" })).toBeTruthy();
    expect(screen.getByTestId("legal-privacy-policy").textContent).toContain("when your account was created");
    expect(screen.getByTestId("legal-app-terms-link").getAttribute("href")).toBe("/content/terms-and-conditions");
    expect(screen.getByTestId("legal-accepted-on").textContent).toBe(
      "You agreed to the terms and conditions on September 1, 2026 at 10:30 a.m.",
    );
    expect(screen.getAllByTestId("legal-program-terms-link").map((link) => link.getAttribute("href"))).toEqual([
      "/content/code-with-us-terms-and-conditions",
      "/content/sprint-with-us-terms-and-conditions",
      "/content/team-with-us-terms-and-conditions",
    ]);
    expect(screen.queryByTestId("legal-terms-updated-warning")).toBeNull();
  });

  it("is not offered to a public sector employee, who is shown their profile instead", async () => {
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/users/me?tab=legal");

    expect(await screen.findByRole("heading", { level: 1, name: "User Profile" })).toBeTruthy();
    expect(screen.queryByTestId("profile-tab-legal")).toBeNull();
    expect(screen.queryByTestId("legal-privacy-policy")).toBeNull();
  });

  it("is not offered to an administrator on a vendor's profile", async () => {
    serve(() => json(200, account({})));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt(`/users/${account({}).id}?tab=legal`);

    await screen.findByTestId("profile-user-identifier");
    expect(screen.queryByTestId("legal-privacy-policy")).toBeNull();
    expect(screen.queryByTestId("legal-accept-updated-terms-button")).toBeNull();
  });
});

describe("agreeing again once the terms have changed (R-4.16)", () => {
  it("warns the vendor, says when they last agreed, and records a fresh agreement", async () => {
    const agreedNow = { ...withdrawn, acceptedTermsAt: "2026-09-30T15:45:00.000Z", lastAcceptedTermsAt: "2026-09-30T15:45:00.000Z" };
    serve((method) => (method === "PUT" ? json(200, agreedNow) : json(200, {})));
    resetSessionForTests({ status: "signed-in", account: withdrawn }, fakeIdentity());
    renderAt("/users/me?tab=legal");

    const warning = await screen.findByTestId("legal-terms-updated-warning");
    expect(warning.textContent).toContain("The terms and conditions have changed");
    expect(screen.getByTestId("legal-accepted-on").textContent).toBe(
      "You last agreed to terms and conditions on September 1, 2026 at 10:30 a.m.",
    );

    fireEvent.click(within(warning).getByTestId("legal-accept-updated-terms-button"));
    const dialog = await screen.findByTestId("legal-accept-terms-modal");
    expect(dialog.textContent).toContain("The date and time you agree will be recorded");
    expect(requests).toEqual([]);
    fireEvent.click(screen.getByTestId("legal-accept-terms-confirm-button"));

    await waitFor(() => expect(screen.queryByTestId("legal-terms-updated-warning")).toBeNull());
    expect(requests).toEqual([
      { method: "PUT", path: `/api/users/${withdrawn.id}`, body: { tag: "acceptTerms" } },
    ]);
    expect(screen.getByTestId("legal-accepted-on").textContent).toBe(
      "You agreed to the terms and conditions on September 30, 2026 at 3:45 p.m.",
    );
  });

  it("keeps the warning when the agreement cannot be saved", async () => {
    serve(() => json(403, { errors: ["Only a vendor agrees to the terms and conditions."] }));
    resetSessionForTests({ status: "signed-in", account: withdrawn }, fakeIdentity());
    renderAt("/users/me?tab=legal");

    fireEvent.click(await screen.findByTestId("legal-accept-updated-terms-button"));
    fireEvent.click(await screen.findByTestId("legal-accept-terms-confirm-button"));

    expect(await screen.findByText("Your agreement could not be saved")).toBeTruthy();
    expect(screen.getByTestId("legal-terms-updated-warning")).toBeTruthy();
  });
});

describe("the screens' structure, names and roles (constitution P1, J5)", () => {
  async function problemsIn(container: HTMLElement): Promise<string[]> {
    const results = await axe.run(container, {
      resultTypes: ["violations"],
      rules: { "color-contrast": { enabled: false } },
    });
    return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
  }

  it("have nothing to answer for on the terms page's managing screen and the warned legal section", async () => {
    serve(() => json(200, page("terms-and-conditions")));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    const terms = renderAt("/content/terms-and-conditions/edit");
    await screen.findByTestId("notify-vendors-button");
    expect(await problemsIn(terms.container)).toEqual([]);
    terms.unmount();

    resetSessionForTests({ status: "signed-in", account: withdrawn }, fakeIdentity());
    const legal = renderAt("/users/me?tab=legal");
    await screen.findByTestId("legal-terms-updated-warning");
    expect(await problemsIn(legal.container)).toEqual([]);
  });
});
