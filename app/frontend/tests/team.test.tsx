import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Account } from "../src/api/accounts";
import type { IdentityClient } from "../src/auth/identity-client";
import { resetSessionForTests } from "../src/auth/session";
import { routeTree } from "../src/router";

/**
 * An organization's team as the screens use it: the management page's Team members and Changelog
 * tabs (organization-edit · team and its dialogs, changelog), and answering an invitation or
 * leaving from the person's own organizations (organization-user-memberships-self). The service is
 * stood in for; what is checked is what the screens show and what they ask of it.
 */

function account(overrides: Partial<Account>): Account {
  return {
    id: "00000000-0000-4000-8000-000000000202",
    type: "VENDOR",
    status: "ACTIVE",
    name: "Blake Placeholder",
    email: "org.owner@example.test",
    jobTitle: null,
    avatarImageFile: null,
    notificationsOn: null,
    acceptedTermsAt: "2026-01-05T17:00:00.000Z",
    lastAcceptedTermsAt: "2026-01-05T17:00:00.000Z",
    idpUsername: "test-vendor-2",
    capabilities: [],
    deactivatedOn: null,
    deactivatedBy: null,
    ...overrides,
  };
}

const owner = account({});
const administrator = account({ id: "00000000-0000-4000-8000-000000000101", type: "ADMIN", name: "Robin Placeholder" });

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

const ORG_ID = "00000000-0000-4000-8000-000000000301";
const OWNER_ID = "00000000-0000-4000-8000-000000000202";

const organization = (overrides: Record<string, unknown> = {}) => ({
  id: ORG_ID,
  legalName: "Northern Pines Digital Ltd.",
  logoImageFile: null,
  streetAddress1: "100 Placeholder Way",
  city: "Victoria",
  region: "BC",
  mailCode: "V0V0V0",
  country: "Canada",
  contactName: "Blake Placeholder",
  contactEmail: "org.owner@example.test",
  active: true,
  owner: { id: OWNER_ID, name: "Blake Placeholder" },
  numTeamMembers: 3,
  swuQualified: false,
  twuQualified: false,
  serviceAreas: [],
  viewerMembership: { membershipType: "OWNER", membershipStatus: "ACTIVE" },
  changelog: [],
  ...overrides,
});

const member = (id: string, userId: string, name: string, membershipType: string, membershipStatus: string, capabilities: string[] = []) => ({
  id,
  membershipType,
  membershipStatus,
  createdAt: "2026-01-05T17:00:00.000Z",
  user: { id: userId, name, capabilities },
  organization: { id: ORG_ID, legalName: "Northern Pines Digital Ltd." },
});

const team = [
  member("a-owner", OWNER_ID, "Blake Placeholder", "OWNER", "ACTIVE", ["Agile Coaching", "Backend Development"]),
  member("a-admin", "u-admin", "Charlie Placeholder", "ADMIN", "ACTIVE", ["Frontend Development"]),
  member("a-member", "u-member", "Dana Placeholder", "MEMBER", "ACTIVE", []),
  member("a-pending", "u-pending", "Quinn Placeholder", "MEMBER", "PENDING", ["User Research"]),
];

const requests: { method: string; path: string; search: string; body: unknown }[] = [];

type Handler = (method: string, path: string, body: unknown, search: string) => Response | Promise<Response>;

function serve(handler: Handler) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: Request) => {
      const type = input.headers.get("content-type") ?? "";
      const body = type.includes("application/json") ? JSON.parse(await input.clone().text()) : undefined;
      const url = new URL(input.url);
      requests.push({ method: input.method, path: url.pathname, search: url.search, body });
      return handler(input.method, url.pathname, body, url.search);
    }),
  );
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** The organization and its team, with anything else answered by `rest`. */
function serveOrganization(record: Record<string, unknown>, members: unknown[], rest?: Handler) {
  serve((method, path, body, search) => {
    if (method === "GET" && path === `/api/organizations/${ORG_ID}`) return json(200, record);
    if (method === "GET" && path === "/api/affiliations" && search.includes(ORG_ID)) return json(200, members);
    return rest ? rest(method, path, body, search) : json(200, {});
  });
}

function renderAt(address: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [address] }) });
  return render(<RouterProvider router={router as never} />);
}

const rows = () => screen.getAllByTestId("organization-team-member-row") as HTMLTableRowElement[];
const changes = () => requests.filter((request) => request.method !== "GET").map((request) => `${request.method} ${request.path}`);

beforeEach(() => {
  requests.length = 0;
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetSessionForTests();
});

describe("the Team members tab, as the owner (R-3.7, R-3.10, R-3.12, R-3.14, R-3.23, R-3.34)", () => {
  it("lists the team with the owner's badge first, marks the pending invitee, and counts active members only", async () => {
    serveOrganization(organization(), team);
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit?tab=team`);

    await screen.findAllByTestId("organization-team-member-row");
    expect(screen.getByTestId("organization-tab-team").getAttribute("aria-current")).toBe("page");
    expect(rows().map((row) => row.cells[0]?.textContent)).toEqual([
      "Blake Placeholder (you)",
      "Charlie Placeholder",
      "Dana Placeholder",
      "Quinn Placeholder",
    ]);
    expect(within(rows()[0] as HTMLElement).getByTestId("organization-owner-badge").textContent).toBe("Owner");
    expect(screen.getAllByTestId("organization-owner-badge")).toHaveLength(1);
    expect(within(rows()[3] as HTMLElement).getByTestId("organization-pending-badge").textContent).toBe("Pending");
    expect(screen.getByText(/Team size: 3 active members/)).toBeTruthy();
    expect(requests.some((request) => request.path === "/api/affiliations" && request.search === `?organization=${ORG_ID}`)).toBe(true);
  });

  it("offers rights on active members but the owner and oneself, Remove on all but their own row, and no Approve or Change owner", async () => {
    serveOrganization(organization(), team);
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit?tab=team`);
    await screen.findAllByTestId("organization-team-member-row");

    const [ownerRow, adminRow, memberRow, pendingRow] = rows() as [
      HTMLTableRowElement,
      HTMLTableRowElement,
      HTMLTableRowElement,
      HTMLTableRowElement,
    ];
    expect(within(ownerRow).queryAllByRole("button")).toEqual([]);
    expect(within(adminRow).getByTestId("organization-member-admin-toggle").textContent).toBe("Remove administrator rights");
    expect(within(memberRow).getByTestId("organization-member-admin-toggle").textContent).toBe("Give administrator rights");
    expect(within(pendingRow).queryByTestId("organization-member-admin-toggle")).toBeNull();
    for (const row of [adminRow, memberRow, pendingRow]) expect(within(row).getByTestId("organization-member-remove-button")).toBeTruthy();
    expect(screen.queryByTestId("organization-member-approve-button")).toBeNull();
    expect(screen.queryByTestId("organization-change-owner-button")).toBeNull();
    expect(screen.getByTestId("organization-add-team-members-button")).toBeTruthy();
  });

  it("does not offer an organization administrator rights over their own row or a Remove on it", async () => {
    serveOrganization(organization({ viewerMembership: { membershipType: "ADMIN", membershipStatus: "ACTIVE" } }), team);
    resetSessionForTests({ status: "signed-in", account: account({ id: "u-admin", name: "Charlie Placeholder" }) }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit?tab=team`);
    await screen.findAllByTestId("organization-team-member-row");
    const adminRow = rows()[1] as HTMLTableRowElement;
    expect(adminRow.cells[0]?.textContent).toBe("Charlie Placeholder (you)");
    expect(within(adminRow).queryAllByRole("button")).toEqual([]);
    expect(within(rows()[2] as HTMLElement).getByTestId("organization-member-admin-toggle")).toBeTruthy();
  });

  it("counts a capability only when an active member holds it", async () => {
    serveOrganization(organization(), team);
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit?tab=team`);
    const summary = await screen.findByTestId("organization-team-capabilities");
    const lines = within(summary).getAllByTestId("organization-team-capability").map((line) => line.textContent);
    expect(lines).toEqual(["Agile Coaching: held", "Backend Development: held", "Frontend Development: held"]);
    // Only the pending invitee holds it, so the summary does not name it; it is listed as missing.
    expect(summary.textContent).not.toContain("User Research");
    const missing = screen.getByRole("heading", { name: "Capabilities the team does not have" }).parentElement as HTMLElement;
    expect(missing.textContent).toContain("User Research: not held");
  });

  it("names a capability in the summary once the invitee holding it has accepted (R-3.34)", async () => {
    const accepted = team.map((entry) => (entry.id === "a-pending" ? { ...entry, membershipStatus: "ACTIVE" } : entry));
    serveOrganization(organization(), accepted);
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit?tab=team`);
    const summary = await screen.findByTestId("organization-team-capabilities");
    expect(summary.textContent).toContain("User Research: held");
  });

  it("puts the warning naming an unregistered address in the tab's field-error message (R-3.30)", async () => {
    serveOrganization(organization(), team, (method) =>
      method === "POST" ? json(400, { inviteeNotRegistered: ["This person is not registered with the Digital Marketplace."] }) : json(200, {}),
    );
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit?tab=team`);
    expect(screen.queryByTestId("field-error")).toBeNull();
    fireEvent.click(await screen.findByTestId("organization-add-team-members-button"));
    const dialog = await screen.findByTestId("organization-invite-dialog");
    fireEvent.change(within(dialog).getByRole("textbox"), { target: { value: "nobody.yet@example.test" } });
    fireEvent.click(within(dialog).getByTestId("organization-invite-submit"));
    const message = await screen.findByTestId("field-error");
    expect(message.textContent).toContain("nobody.yet@example.test is not registered with the Digital Marketplace");
    expect(screen.getAllByTestId("field-error")).toHaveLength(1);
  });

  it("invites two addresses at once, as ordinary members, and reports a refused and an unregistered one by address", async () => {
    serveOrganization(organization(), team, (method, path, body) => {
      if (method !== "POST" || path !== "/api/affiliations") return json(200, {});
      const email = (body as { userEmail: string }).userEmail;
      if (email === "vendor.invited@example.test") return json(201, member("a-new", "u-new", "Invited", "MEMBER", "PENDING"));
      if (email === "staff.one@example.test") return json(400, { userEmail: ["Only people with a vendor account can be invited."] });
      return json(400, { inviteeNotRegistered: ["This person is not registered with the Digital Marketplace."] });
    });
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit?tab=team`);

    fireEvent.click(await screen.findByTestId("organization-add-team-members-button"));
    const dialog = await screen.findByTestId("organization-invite-dialog");
    fireEvent.click(within(dialog).getByTestId("organization-invite-add-email"));
    fireEvent.click(within(dialog).getByTestId("organization-invite-add-email"));
    const fields = within(dialog).getAllByRole("textbox") as HTMLInputElement[];
    fireEvent.change(fields[0] as HTMLInputElement, { target: { value: "vendor.invited@example.test" } });
    fireEvent.change(fields[1] as HTMLInputElement, { target: { value: "staff.one@example.test" } });
    fireEvent.change(fields[2] as HTMLInputElement, { target: { value: "newperson@example.test" } });
    fireEvent.click(within(dialog).getByTestId("organization-invite-submit"));

    const refusal = await screen.findByTestId("organization-invite-refused");
    expect(refusal.textContent).toContain("1 invitation was not sent");
    expect(refusal.textContent).toContain("staff.one@example.test: only people with a vendor account can be invited.");
    expect(screen.getByTestId("organization-invite-unregistered").textContent).toContain(
      "newperson@example.test is not registered with the Digital Marketplace",
    );
    const sent = requests.filter((request) => request.method === "POST").map((request) => request.body);
    expect(sent).toHaveLength(3);
    expect(sent).toEqual(
      expect.arrayContaining([
        { organization: ORG_ID, userEmail: "vendor.invited@example.test", membershipType: "MEMBER" },
        { organization: ORG_ID, userEmail: "staff.one@example.test", membershipType: "MEMBER" },
        { organization: ORG_ID, userEmail: "newperson@example.test", membershipType: "MEMBER" },
      ]),
    );
  });

  it("sends both invitations before either is answered, and lists both invitees once they are", async () => {
    const invited: string[] = [];
    let answerAll: () => void = () => {};
    const answered = new Promise<void>((resolve) => (answerAll = resolve));
    serve(async (method, path, body, search) => {
      if (method === "GET" && path === `/api/organizations/${ORG_ID}`) return json(200, organization({ numTeamMembers: 1 }));
      if (method === "GET" && path === "/api/affiliations" && search.includes(ORG_ID))
        return json(200, [
          team[0],
          ...invited.map((email, index) => member(`a-${index}`, `u-${index}`, email.split("@")[0] ?? email, "MEMBER", "PENDING")),
        ]);
      if (method === "POST" && path === "/api/affiliations") {
        invited.push((body as { userEmail: string }).userEmail);
        await answered;
        return json(201, {});
      }
      return json(200, {});
    });
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit?tab=team`);

    fireEvent.click(await screen.findByTestId("organization-add-team-members-button"));
    const dialog = await screen.findByTestId("organization-invite-dialog");
    fireEvent.click(within(dialog).getByTestId("organization-invite-add-email"));
    const fields = within(dialog).getAllByRole("textbox") as HTMLInputElement[];
    fireEvent.change(fields[0] as HTMLInputElement, { target: { value: "first.vendor@example.test" } });
    fireEvent.change(fields[1] as HTMLInputElement, { target: { value: "second.vendor@example.test" } });
    fireEvent.click(within(dialog).getByTestId("organization-invite-submit"));

    await waitFor(() => expect(invited.sort()).toEqual(["first.vendor@example.test", "second.vendor@example.test"]));
    answerAll();
    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(rows().map((row) => row.cells[1]?.textContent)).toEqual(["Owner", "Pending", "Pending"]);
    expect(screen.getByText(/Team size: 1 active member\./)).toBeTruthy();
  });

  it("invites each of several addresses pasted into one field", async () => {
    serveOrganization(organization(), team, () => json(201, {}));
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit?tab=team`);
    fireEvent.click(await screen.findByTestId("organization-add-team-members-button"));
    const dialog = await screen.findByTestId("organization-invite-dialog");
    fireEvent.change(within(dialog).getByRole("textbox"), { target: { value: "one@example.test, two@example.test" } });
    fireEvent.click(within(dialog).getByTestId("organization-invite-submit"));
    await waitFor(() => expect(changes()).toHaveLength(2));
    const sent = requests.filter((request) => request.method === "POST").map((request) => (request.body as { userEmail: string }).userEmail);
    expect(sent.sort()).toEqual(["one@example.test", "two@example.test"]);
  });

  it("still warns about an unregistered address after the tab is drawn again, until the next action (R-3.30)", async () => {
    serveOrganization(organization(), team, (method) =>
      method === "POST" ? json(400, { inviteeNotRegistered: ["This person is not registered with the Digital Marketplace."] }) : json(200, {}),
    );
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    const first = renderAt(`/organizations/${ORG_ID}/edit?tab=team`);
    fireEvent.click(await screen.findByTestId("organization-add-team-members-button"));
    const dialog = await screen.findByTestId("organization-invite-dialog");
    fireEvent.change(within(dialog).getByRole("textbox"), { target: { value: "nobody.yet@example.test" } });
    fireEvent.click(within(dialog).getByTestId("organization-invite-submit"));
    await screen.findByTestId("organization-invite-unregistered");
    await waitFor(() => expect(screen.queryByTestId("organization-invite-dialog")).toBeNull());
    first.unmount();

    // The page is drawn afresh, as a reload draws it.
    renderAt(`/organizations/${ORG_ID}/edit?tab=team`);
    const warning = await screen.findByTestId("organization-invite-unregistered");
    expect(warning.textContent).toContain("nobody.yet@example.test is not registered with the Digital Marketplace");
    expect(within(warning).getByRole("alert")).toBeTruthy();
    expect(rows().map((row) => row.cells[0]?.textContent)).not.toContain("nobody.yet@example.test");

    fireEvent.click(screen.getByTestId("organization-add-team-members-button"));
    expect(screen.queryByTestId("organization-invite-unregistered")).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
  });

  it("shows the refusal of an invitation that named another membership type (R-3.17)", async () => {
    serveOrganization(organization(), team, (method) =>
      method === "POST" ? json(400, { membershipType: ["Invalid membership type: an invitation can only be for a member or an owner."] }) : json(200, {}),
    );
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit?tab=team`);
    fireEvent.click(await screen.findByTestId("organization-add-team-members-button"));
    const dialog = await screen.findByTestId("organization-invite-dialog");
    fireEvent.change(within(dialog).getByRole("textbox"), { target: { value: "vendor.one@example.test" } });
    fireEvent.click(within(dialog).getByTestId("organization-invite-submit"));
    expect((await screen.findByTestId("organization-invalid-membership-type-error")).textContent).toContain("invalid membership type");
  });

  it("sends nothing while an address is not a valid one", async () => {
    serveOrganization(organization(), team);
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit?tab=team`);
    fireEvent.click(await screen.findByTestId("organization-add-team-members-button"));
    const dialog = await screen.findByTestId("organization-invite-dialog");
    fireEvent.change(within(dialog).getByRole("textbox"), { target: { value: "not-an-email" } });
    fireEvent.click(within(dialog).getByTestId("organization-invite-submit"));
    expect(await within(dialog).findByText("Enter an email address in a valid format, like name@example.com")).toBeTruthy();
    expect(changes()).toEqual([]);
  });

  it("gives administrator rights only once the statement is confirmed, and withdraws them at once", async () => {
    serveOrganization(organization(), team, () => json(200, member("a-member", "u-member", "Dana Placeholder", "ADMIN", "ACTIVE")));
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit?tab=team`);
    await screen.findAllByTestId("organization-team-member-row");

    fireEvent.click(within(rows()[2] as HTMLElement).getByTestId("organization-member-admin-toggle"));
    const dialog = await screen.findByTestId("organization-admin-rights-dialog");
    const confirm = within(dialog).getByTestId("organization-admin-rights-confirm");
    expect(confirm.hasAttribute("disabled") || confirm.getAttribute("data-disabled") === "true").toBe(true);
    fireEvent.click(within(within(dialog).getByTestId("organization-admin-terms-checkbox")).getByRole("checkbox"));
    fireEvent.click(within(dialog).getByTestId("organization-admin-rights-confirm"));
    await waitFor(() => expect(changes()).toEqual(["PUT /api/affiliations/a-member"]));
    expect(requests.find((request) => request.method === "PUT")?.body).toEqual({ tag: "updateAdminStatus", value: true });

    await waitFor(() => expect(screen.queryByTestId("organization-admin-rights-dialog")).toBeNull());
    fireEvent.click(within(rows()[1] as HTMLElement).getByTestId("organization-member-admin-toggle"));
    await waitFor(() => expect(changes()).toEqual(["PUT /api/affiliations/a-member", "PUT /api/affiliations/a-admin"]));
    expect(requests.filter((request) => request.method === "PUT")[1]?.body).toEqual({ tag: "updateAdminStatus", value: false });
  });

  it("asks before removing a member, then ends the membership", async () => {
    serveOrganization(organization(), team, () => json(200, member("a-member", "u-member", "Dana Placeholder", "MEMBER", "INACTIVE")));
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit?tab=team`);
    await screen.findAllByTestId("organization-team-member-row");
    fireEvent.click(within(rows()[2] as HTMLElement).getByTestId("organization-member-remove-button"));
    const dialog = await screen.findByTestId("organization-member-remove-dialog");
    expect(dialog.textContent).toContain("Dana Placeholder will no longer be on Northern Pines Digital Ltd.’s team");
    expect(changes()).toEqual([]);
    fireEvent.click(within(dialog).getByTestId("organization-member-remove-confirm"));
    await waitFor(() => expect(changes()).toEqual(["DELETE /api/affiliations/a-member"]));
  });
});

describe("the Team members tab, as a service administrator (R-3.9, R-3.13)", () => {
  it("offers Approve on the pending invitee and Change owner, choosing among active members only", async () => {
    serveOrganization(organization({ viewerMembership: null }), team, () => json(200, {}));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit?tab=team`);
    await screen.findAllByTestId("organization-team-member-row");

    expect(within(rows()[3] as HTMLElement).getByTestId("organization-member-approve-button")).toBeTruthy();
    expect(screen.getAllByTestId("organization-member-approve-button")).toHaveLength(1);
    expect(within(rows()[0] as HTMLElement).getByTestId("organization-member-remove-button")).toBeTruthy();

    fireEvent.click(screen.getByTestId("organization-change-owner-button"));
    const dialog = await screen.findByTestId("organization-change-owner-dialog");
    const choices = Array.from(dialog.ownerDocument.querySelectorAll("select option")).map((option) => option.textContent);
    expect(choices).toContain("Charlie Placeholder");
    expect(choices).toContain("Dana Placeholder");
    expect(choices).not.toContain("Quinn Placeholder");
    expect(choices).not.toContain("Blake Placeholder");
    const select = dialog.ownerDocument.querySelector("select") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "a-member" } });
    fireEvent.click(within(dialog).getByTestId("organization-change-owner-confirm"));
    // Choosing asks for confirmation in the same dialog; nothing is sent yet.
    const confirm = await within(dialog).findByRole("button", { name: "Yes, change owner" });
    expect(dialog.textContent).toContain("Make Dana Placeholder the owner?");
    expect(dialog.textContent).toContain("Blake Placeholder, the current owner, will become an ordinary member.");
    expect(changes()).toEqual([]);
    expect(confirm.hasAttribute("disabled")).toBe(false);
    fireEvent.click(confirm);
    // The dialog closes at once, without waiting on the answer.
    expect(screen.queryByTestId("organization-change-owner-dialog")).toBeNull();
    await waitFor(() => expect(changes()).toEqual(["PUT /api/affiliations/a-member"]));
    expect(requests.find((request) => request.method === "PUT")?.body).toEqual({ tag: "changeOwner" });

    fireEvent.click(within(rows()[3] as HTMLElement).getByTestId("organization-member-approve-button"));
    await waitFor(() => expect(changes()).toEqual(["PUT /api/affiliations/a-member", "PUT /api/affiliations/a-pending"]));
  });
});

describe("trying to remove the sole owner (R-3.11)", () => {
  it("offers Remove on the owner's row and shows the service's refusal, leaving the owner on the team", async () => {
    serveOrganization(organization({ viewerMembership: null }), team, (method) =>
      method === "DELETE" ? json(400, { errors: ["This is the sole owner for the organization, and cannot be removed."] }) : json(200, {}),
    );
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit?tab=team`);
    await screen.findAllByTestId("organization-team-member-row");

    const remove = within(rows()[0] as HTMLElement).getByRole("button", { name: "Remove Blake Placeholder" });
    expect(remove.textContent).toBe("Remove");
    fireEvent.click(remove);
    const dialog = await screen.findByTestId("organization-member-remove-dialog");
    const confirm = within(dialog).getByTestId("organization-member-remove-confirm");
    fireEvent.click(confirm);
    expect(screen.queryByTestId("organization-member-remove-dialog")).toBeNull();
    await waitFor(() => expect(changes()).toEqual(["DELETE /api/affiliations/a-owner"]));
    const message = await screen.findByTestId("field-error");
    expect(message.textContent).toContain("This is the sole owner for the organization");
    expect(rows()[0]?.cells[0]?.textContent).toBe("Blake Placeholder");
  });

  it("offers an organization administrator Remove on the owner's row, but never the owner on their own", async () => {
    serveOrganization(organization({ viewerMembership: { membershipType: "ADMIN", membershipStatus: "ACTIVE" } }), team);
    resetSessionForTests({ status: "signed-in", account: account({ id: "u-admin", name: "Charlie Placeholder" }) }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit?tab=team`);
    await screen.findAllByTestId("organization-team-member-row");
    expect(within(rows()[0] as HTMLElement).getByTestId("organization-member-remove-button")).toBeTruthy();
  });
});

describe("the Changelog tab (R-3.33)", () => {
  it("lists each change newest first, naming what happened, to whom, when and by whom", async () => {
    serveOrganization(
      organization({
        changelog: [
          {
            id: "e2",
            event: "ADMIN_STATUS_REVOKED",
            createdAt: "2026-09-14T15:05:00.000Z",
            member: { id: "u-member", name: "Dana Placeholder" },
            createdBy: { id: OWNER_ID, name: "Blake Placeholder" },
          },
          {
            id: "e1",
            event: "ADMIN_STATUS_GRANTED",
            createdAt: "2026-09-10T09:40:00.000Z",
            member: { id: "u-member", name: "Dana Placeholder" },
            createdBy: { id: OWNER_ID, name: "Blake Placeholder" },
          },
        ],
      }),
      team,
    );
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit?tab=changelog`);
    const entries = (await screen.findAllByTestId("organization-changelog-entry")) as HTMLTableRowElement[];
    expect(entries.map((entry) => Array.from(entry.cells).map((cell) => cell.textContent))).toEqual([
      ["September 14, 2026 at 3:05 p.m.", "Admin Rights Removed", "Dana Placeholder", "Blake Placeholder"],
      ["September 10, 2026 at 9:40 a.m.", "Admin Rights Given", "Dana Placeholder", "Blake Placeholder"],
    ]);
  });
});

async function problemsIn(container: HTMLElement): Promise<string[]> {
  const results = await axe.run(container, {
    resultTypes: ["violations"],
    // Needs a browser to measure; nothing here sets a colour.
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
}

describe("the team screens have nothing a machine can find to answer for (WCAG 2.1 AA)", () => {
  it("on the Team members tab, as a service administrator", async () => {
    serveOrganization(organization({ viewerMembership: null }), team);
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    const { container } = renderAt(`/organizations/${ORG_ID}/edit?tab=team`);
    await screen.findAllByTestId("organization-team-member-row");
    expect(await problemsIn(container)).toEqual([]);
  }, 30_000);

  it("on one's own organizations with an invitation waiting", async () => {
    serve(() => json(200, [own("m-member", "MEMBER", "ACTIVE", "Aurora"), own("m-pending", "MEMBER", "PENDING", "Tidewater")]));
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    const { container } = renderAt("/users/me?tab=organizations");
    await screen.findByTestId("membership-affiliated-table");
    expect(await problemsIn(container)).toEqual([]);
  }, 30_000);
});

// ------------------------------------------------------------------------ one's own organizations

const own = (id: string, membershipType: string, membershipStatus: string, legalName: string) => ({
  id,
  membershipType,
  membershipStatus,
  organization: { id: `org-${id}`, legalName, numTeamMembers: 2, swuQualified: false },
});

describe("answering an invitation and leaving, from one's own organizations (R-3.9, R-3.10, R-3.32, R-3.35)", () => {
  const memberships = [own("m-owned", "OWNER", "ACTIVE", "Northwind"), own("m-member", "MEMBER", "ACTIVE", "Aurora"), own("m-pending", "MEMBER", "PENDING", "Tidewater")];

  it("opens the confirmation to join on arriving from the message's accept choice, and accepts once confirmed", async () => {
    let answered = false;
    serve((method) => {
      if (method === "PUT") {
        answered = true;
        return json(200, {});
      }
      return json(200, answered ? [memberships[0], memberships[1], { ...memberships[2], membershipStatus: "ACTIVE" }] : memberships);
    });
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    renderAt("/users/me?tab=organizations&invitation=m-pending&answer=accept");

    const dialog = await screen.findByTestId("membership-accept-dialog");
    expect(dialog.textContent).toContain("Join Tidewater?");
    expect(changes()).toEqual([]);
    fireEvent.click(within(dialog).getByTestId("membership-confirm-button"));
    await waitFor(() => expect(changes()).toEqual(["PUT /api/affiliations/m-pending"]));
    expect(requests.find((request) => request.method === "PUT")?.body).toEqual({ tag: "approve" });
    expect(await screen.findByText("You have joined Tidewater.")).toBeTruthy();
    await waitFor(() => expect(screen.queryByTestId("organization-pending-badge")).toBeNull());
  });

  it("opens the confirmation to decline on arriving from the message's decline choice, and declines once confirmed", async () => {
    serve((method) => (method === "DELETE" ? json(200, {}) : json(200, memberships)));
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    renderAt("/users/me?tab=organizations&invitation=m-pending&answer=decline");

    const dialog = await screen.findByTestId("membership-decline-dialog");
    expect(dialog.textContent).toContain("Decline the invitation from Tidewater?");
    fireEvent.click(within(dialog).getByTestId("membership-confirm-button"));
    await waitFor(() => expect(changes()).toEqual(["DELETE /api/affiliations/m-pending"]));
  });

  it("says an invitation is no longer waiting when the message's choice names one that is not pending", async () => {
    serve(() => json(200, memberships));
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    renderAt("/users/me?tab=organizations&invitation=m-member&answer=accept");
    expect(await screen.findByText("That invitation is no longer waiting for your answer")).toBeTruthy();
    expect(screen.queryByTestId("membership-accept-dialog")).toBeNull();
  });

  it("offers Accept and Decline on a pending invitation, Leave on an active membership, and nothing on one owned", async () => {
    serve((method) => (method === "DELETE" ? json(200, {}) : json(200, memberships)));
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    renderAt("/users/me?tab=organizations");

    const owned = await screen.findByTestId("membership-owned-table");
    expect(within(owned).queryAllByRole("button")).toEqual([]);
    const affiliated = screen.getByTestId("membership-affiliated-table");
    expect(within(affiliated).getByTestId("membership-approve-button").getAttribute("aria-label")).toBe("Accept the invitation from Tidewater");
    expect(within(affiliated).getByTestId("membership-reject-button")).toBeTruthy();
    fireEvent.click(within(affiliated).getByTestId("membership-leave-button"));
    const dialog = await screen.findByTestId("membership-leave-dialog");
    expect(dialog.textContent).toContain("Leave Aurora?");
    await act(async () => {
      fireEvent.click(within(dialog).getByTestId("membership-confirm-button"));
    });
    await waitFor(() => expect(changes()).toEqual(["DELETE /api/affiliations/m-member"]));
  });

  it("no longer lists the organization left by the time it says so, while the list is still being fetched again", async () => {
    let left = false;
    let release: (response: Response) => void = () => {};
    serve((method) => {
      if (method === "DELETE") {
        left = true;
        return json(200, {});
      }
      // The re-fetch after leaving is held until the end of the test.
      return left ? new Promise<Response>((resolve) => (release = resolve)) : json(200, memberships);
    });
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    renderAt("/users/me?tab=organizations");

    const affiliated = await screen.findByTestId("membership-affiliated-table");
    fireEvent.click(within(affiliated).getByTestId("membership-leave-button"));
    const dialog = await screen.findByTestId("membership-leave-dialog");
    fireEvent.click(within(dialog).getByTestId("membership-confirm-button"));

    await screen.findByText("You have left Aurora.");
    await waitFor(() => expect(requests.filter((request) => request.method === "GET" && request.path === "/api/affiliations").length).toBe(2));
    const table = screen.getByTestId("membership-affiliated-table");
    expect(table.textContent).not.toContain("Aurora");
    expect(within(table).queryByTestId("membership-leave-button")).toBeNull();
    expect(table.textContent).toContain("Tidewater");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("alertdialog")).toBeNull();

    await act(async () => release(json(200, [memberships[0], memberships[2]])));
    expect(screen.getByText("You have left Aurora.")).toBeTruthy();
    expect(screen.getByTestId("membership-affiliated-table").textContent).not.toContain("Aurora");
  });

  it("shows a declined invitation gone and an accepted one active as soon as each is announced", async () => {
    let answered = false;
    serve((method) => {
      if (method !== "GET") {
        answered = true;
        return json(200, {});
      }
      return answered ? new Promise<Response>(() => {}) : json(200, memberships);
    });
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    renderAt("/users/me?tab=organizations&invitation=m-pending&answer=decline");

    const dialog = await screen.findByTestId("membership-decline-dialog");
    fireEvent.click(within(dialog).getByTestId("membership-confirm-button"));
    await screen.findByText("You have declined the invitation from Tidewater.");
    expect(screen.getByTestId("membership-affiliated-table").textContent).not.toContain("Tidewater");
    expect(screen.queryByTestId("organization-pending-badge")).toBeNull();
    expect(screen.queryByTestId("membership-decline-dialog")).toBeNull();
  });
});

describe("the memberships once an answer is confirmed", () => {
  const listed = [own("a", "MEMBER", "ACTIVE", "Aurora"), own("b", "MEMBER", "PENDING", "Tidewater")] as never[];

  it("drops a membership left or an invitation declined, and makes an accepted invitation active", async () => {
    const { membershipsAfter } = await import("../src/screens/user-profile");
    expect(membershipsAfter(listed, "a", "leave").map((m) => m.id)).toEqual(["b"]);
    expect(membershipsAfter(listed, "b", "decline").map((m) => m.id)).toEqual(["a"]);
    expect(membershipsAfter(listed, "b", "accept").map((m) => m.membershipStatus)).toEqual(["ACTIVE", "ACTIVE"]);
  });
});
