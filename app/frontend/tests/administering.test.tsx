import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Account } from "../src/api/accounts";
import type { IdentityClient } from "../src/auth/identity-client";
import { resetSessionForTests } from "../src/auth/session";
import { routeTree } from "../src/router";

/**
 * An administrator managing people's accounts, as the screens do it (user-list, user-profile).
 * The service and the identity provider are stood in for; what is checked is what the screens
 * show and ask of the service.
 */

function account(overrides: Partial<Account> = {}): Account {
  return {
    id: "00000000-0000-4000-8000-000000000201",
    type: "VENDOR",
    status: "ACTIVE",
    name: "Alex Placeholder",
    email: "vendor.one@example.test",
    jobTitle: null,
    avatarImageFile: null,
    notificationsOn: null,
    acceptedTermsAt: "2026-01-05T17:00:00.000Z",
    lastAcceptedTermsAt: "2026-01-05T17:00:00.000Z",
    idpUsername: "test-vendor-1",
    capabilities: [],
    deactivatedOn: null,
    deactivatedBy: null,
    ...overrides,
  };
}

const administrator = account({
  id: "00000000-0000-4000-8000-000000000101",
  type: "ADMIN",
  name: "Robin Placeholder",
  idpUsername: "test-admin",
});
const staff = account({
  id: "00000000-0000-4000-8000-000000000102",
  type: "GOV",
  name: "Casey Placeholder",
  email: "staff.one@example.test",
  idpUsername: "test-gov",
});
const vendor = account();
const deactivatedVendor = account({
  id: "00000000-0000-4000-8000-000000000205",
  name: "Ellis Placeholder",
  status: "INACTIVE_ADMIN",
  deactivatedOn: "2026-09-02T17:00:00.000Z",
  deactivatedBy: administrator.id,
});

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

const requests: { method: string; address: string; body: unknown }[] = [];

function serve(handler: (request: Request) => Response | Promise<Response>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: Request) => {
      const type = input.headers.get("content-type") ?? "";
      const body = type.includes("application/json") ? JSON.parse(await input.clone().text()) : undefined;
      const url = new URL(input.url);
      requests.push({ method: input.method, address: `${url.pathname}${url.search}`, body });
      return handler(input);
    }),
  );
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function renderAt(address: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [address] }) });
  return render(<RouterProvider router={router as never} />);
}

const checkboxIn = (element: HTMLElement) => within(element).getByRole("checkbox") as HTMLInputElement;

beforeEach(() => {
  requests.length = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetSessionForTests();
});

describe("the list of users (R-4.14, R-4.21)", () => {
  it("is the missing page, asked of nobody, for anyone but an administrator", async () => {
    serve(() => json(200, []));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/users");

    await screen.findByTestId("not-found-page");
    expect(requests).toEqual([]);
  });

  it("lists everyone, active accounts first, and narrows by words of a name in any order", async () => {
    serve(() => json(200, [deactivatedVendor, vendor, staff, administrator]));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt("/users");

    await screen.findAllByTestId("user-list-row");
    const names = () => screen.getAllByTestId("user-list-profile-link").map((link) => link.textContent);
    expect(names()).toEqual(["Casey Placeholder", "Robin Placeholder", "Alex Placeholder", "Ellis Placeholder"]);
    expect(screen.getAllByTestId("user-list-status-badge").map((badge) => badge.textContent)).toEqual([
      "Active",
      "Active",
      "Active",
      "Inactive",
    ]);
    expect(screen.getAllByTestId("user-list-admin-check").map((cell) => cell.textContent)).toEqual([
      "No",
      "Yes",
      "No",
      "No",
    ]);
    expect(screen.getAllByTestId("user-list-profile-link")[0]?.getAttribute("href")).toBe(`/users/${staff.id}`);

    const search = within(screen.getByTestId("user-list-search")).getByRole("searchbox");
    fireEvent.change(search, { target: { value: "placeholder ell" } });
    expect(names()).toEqual(["Ellis Placeholder"]);
  });

  it("is offered in the navigation to an administrator alone", async () => {
    serve(() => json(200, []));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    const view = renderAt("/dashboard");
    expect(await screen.findByRole("link", { name: "Users" })).toBeTruthy();
    view.unmount();

    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/dashboard");
    await screen.findByRole("link", { name: "My profile" });
    expect(screen.queryByRole("link", { name: "Users" })).toBeNull();
  });
});

describe("the contact-list export (R-4.32)", () => {
  it("is unavailable until a kind and a field are chosen, then asks the service for them", async () => {
    serve((request) =>
      new URL(request.url).pathname === "/api/contact-list"
        ? new Response("Email\r\n", {
            status: 200,
            headers: { "content-type": "text/csv", "content-disposition": 'attachment; filename="dm-contacts-2026-09-30.csv"' },
          })
        : json(200, [vendor, administrator]),
    );
    const createObjectURL = vi.fn(() => "blob:contacts");
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt("/users");

    fireEvent.click(await screen.findByTestId("contact-list-open-export"));
    const modal = await screen.findByTestId("contact-list-modal");
    const exportButton = within(modal).getByTestId("contact-list-export-button") as HTMLButtonElement;
    expect(exportButton.disabled).toBe(true);

    const [, vendors] = within(modal).getAllByTestId("contact-list-user-type");
    fireEvent.click(checkboxIn(vendors as HTMLElement));
    expect(exportButton.disabled).toBe(true);
    const [first, , email] = within(modal).getAllByTestId("contact-list-field");
    fireEvent.click(checkboxIn(email as HTMLElement));
    fireEvent.click(checkboxIn(first as HTMLElement));
    expect(exportButton.disabled).toBe(false);

    fireEvent.click(exportButton);
    await waitFor(() => expect(createObjectURL).toHaveBeenCalled());
    expect(requests.at(-1)?.address).toBe("/api/contact-list?userTypes=VENDOR&fields=email%2CfirstName");
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

  it("have nothing to answer for on the list of users", async () => {
    serve(() => json(200, [vendor, administrator, deactivatedVendor]));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    const { container } = renderAt("/users");
    await screen.findAllByTestId("user-list-row");

    expect(await problemsIn(container)).toEqual([]);
  }, 30_000);

  it("have nothing to answer for on an administrator's view of somebody else's profile", async () => {
    serve(() => json(200, deactivatedVendor));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    const { container } = renderAt(`/users/${deactivatedVendor.id}`);
    await screen.findByTestId("profile-reactivate-button");

    expect(await problemsIn(container)).toEqual([]);
  }, 30_000);
});

describe("an administrator's powers on somebody else's profile (R-4.12, R-4.19, R-4.30)", () => {
  it("grants a public sector employee administrator rights as soon as the box is ticked", async () => {
    serve((request) =>
      request.method === "PUT" ? json(200, { ...staff, type: "ADMIN" }) : json(200, staff),
    );
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt(`/users/${staff.id}`);

    fireEvent.click(checkboxIn(await screen.findByTestId("profile-admin-checkbox")));
    await screen.findByText("Saved. Casey Placeholder is now an administrator.");
    expect(requests.at(-1)).toMatchObject({
      method: "PUT",
      address: `/api/users/${staff.id}`,
      body: { tag: "updateAdminPermissions", value: true },
    });
    expect(checkboxIn(screen.getByTestId("profile-admin-checkbox")).checked).toBe(true);
  });

  it("shows the refusal for a vendor and leaves the box unticked", async () => {
    serve((request) =>
      request.method === "PUT"
        ? json(400, { errors: ["Vendors cannot be granted administrator permissions."] })
        : json(200, vendor),
    );
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt(`/users/${vendor.id}`);

    fireEvent.click(checkboxIn(await screen.findByTestId("profile-admin-checkbox")));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Vendors cannot be granted administrator permissions",
    );
    expect(checkboxIn(screen.getByTestId("profile-admin-checkbox")).checked).toBe(false);
  });

  it("deactivates an active account once confirmed, then offers to reactivate it", async () => {
    serve((request) =>
      request.method === "DELETE"
        ? json(200, { ...vendor, status: "INACTIVE_ADMIN", deactivatedOn: "2026-09-30T17:00:00.000Z" })
        : json(200, vendor),
    );
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt(`/users/${vendor.id}`);

    fireEvent.click(await screen.findByTestId("profile-deactivate-button"));
    const modal = await screen.findByTestId("activation-modal");
    expect(modal.textContent).toContain("Alex Placeholder will no longer be able to sign in");
    fireEvent.click(within(modal).getByTestId("activation-confirm-button"));

    expect(await screen.findByTestId("profile-reactivate-button")).toBeTruthy();
    expect(requests.at(-1)).toMatchObject({ method: "DELETE", address: `/api/users/${vendor.id}` });
    expect(screen.getByTestId("profile-status-badge").textContent).toBe("Inactive");
    expect(screen.getByText(/An administrator deactivated this account on/).textContent).toContain(
      "September 30, 2026",
    );
  });

  it("reactivates an account an administrator deactivated once confirmed", async () => {
    serve((request) =>
      request.method === "PUT" ? json(200, { ...deactivatedVendor, status: "ACTIVE" }) : json(200, deactivatedVendor),
    );
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt(`/users/${deactivatedVendor.id}`);

    fireEvent.click(await screen.findByTestId("profile-reactivate-button"));
    const modal = await screen.findByTestId("activation-modal");
    fireEvent.click(within(modal).getByTestId("activation-confirm-button"));

    expect(await screen.findByTestId("profile-deactivate-button")).toBeTruthy();
    expect(requests.at(-1)).toMatchObject({ method: "PUT", body: { tag: "reactivateUser" } });
    expect(screen.getByTestId("profile-status-badge").textContent).toBe("Active");
  });

  it("offers no reactivation for an account its owner deactivated, saying they sign in again", async () => {
    serve(() => json(200, { ...vendor, status: "INACTIVE_USER", deactivatedOn: "2026-09-02T17:00:00.000Z" }));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt(`/users/${vendor.id}`);

    await screen.findByText("This person deactivated their own account on September 2, 2026");
    expect(screen.queryByTestId("profile-reactivate-button")).toBeNull();
    expect(screen.queryByTestId("profile-deactivate-button")).toBeNull();
  });

  it("offers no deactivation on an administrator's own profile (R-4.31)", async () => {
    serve(() => json(200, administrator));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt("/users/me");

    await screen.findByTestId("profile-permissions-label");
    expect(screen.queryByTestId("profile-deactivate-button")).toBeNull();
    expect(screen.queryByTestId("profile-admin-checkbox")).toBeNull();
  });
});
