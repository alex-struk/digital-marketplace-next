import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import axe from "axe-core";
import { File as NodeFile } from "node:buffer";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Account } from "../src/api/accounts";
import type { IdentityClient } from "../src/auth/identity-client";
import { resetSessionForTests } from "../src/auth/session";
import { routeTree } from "../src/router";
import { shownProblems, EMPTY_PROFILE } from "../src/screens/organization-form";

/**
 * Organizations as the screens use them: the list (organization-list), registering
 * (organization-create), the management page's Organization tab (organization-edit) and the
 * person's own organizations (organization-user-memberships-self). The service is stood in for;
 * what is checked is what the screens show and what they ask of it.
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
    acceptedTermsAt: "2026-01-05T17:00:00.000Z",
    lastAcceptedTermsAt: "2026-01-05T17:00:00.000Z",
    idpUsername: "test-vendor-1",
    capabilities: [],
    deactivatedOn: null,
    deactivatedBy: null,
    ...overrides,
  };
}

const vendor = account({});
const vendorWithoutTerms = account({ acceptedTermsAt: null });
const administrator = account({ id: "00000000-0000-4000-8000-000000000101", type: "ADMIN", name: "Robin Placeholder" });
const staff = account({ id: "00000000-0000-4000-8000-000000000102", type: "GOV", name: "Casey Placeholder" });

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
const LOGO_ID = "5b2e0c3a-8d41-4f6e-a1c2-000000000811";

const organization = (overrides: Record<string, unknown> = {}) => ({
  id: ORG_ID,
  createdAt: "2026-01-05T17:00:00.000Z",
  updatedAt: "2026-01-05T17:00:00.000Z",
  legalName: "Northern Pines Digital Ltd.",
  logoImageFile: null,
  websiteUrl: "https://northern-pines.example.test",
  streetAddress1: "100 Placeholder Way",
  streetAddress2: null,
  city: "Victoria",
  region: "BC",
  mailCode: "V0V0V0",
  country: "Canada",
  contactName: "Blake Placeholder",
  contactTitle: "Managing Director",
  contactEmail: "org.owner@example.test",
  contactPhone: "250-555-0101",
  active: true,
  deactivatedOn: null,
  deactivatedBy: null,
  acceptedSWUTerms: "2026-01-05T17:00:00.000Z",
  acceptedTWUTerms: "2026-01-05T17:00:00.000Z",
  owner: { id: "00000000-0000-4000-8000-000000000202", name: "Blake Placeholder" },
  numTeamMembers: 3,
  swuQualified: true,
  twuQualified: false,
  serviceAreas: [],
  viewerMembership: { membershipType: "OWNER", membershipStatus: "ACTIVE" },
  ...overrides,
});

const listed = (id: string, legalName: string, details?: Record<string, unknown>) => ({
  id,
  legalName,
  logoImageFile: null,
  active: true,
  serviceAreas: [],
  ...(details ?? {}),
});

const requests: { method: string; path: string; search: string; body: unknown }[] = [];

function serve(handler: (method: string, path: string, body: unknown) => Response | Promise<Response>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: Request) => {
      const type = input.headers.get("content-type") ?? "";
      const body = type.includes("application/json") ? JSON.parse(await input.clone().text()) : undefined;
      const url = new URL(input.url);
      requests.push({ method: input.method, path: url.pathname, search: url.search, body });
      return handler(input.method, url.pathname, body);
    }),
  );
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function renderAt(address: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [address] }) });
  const view = render(<RouterProvider router={router as never} />);
  return { ...view, router };
}

const input = (testId: string) => screen.getByTestId(testId).querySelector("input") as HTMLInputElement;

/** A read-only profile field's value, as the Organization tab shows it. */
const shown = (testId: string) => screen.getByTestId(testId).textContent;

/** Everything the Organization tab's section reads as. */
const tabText = () => screen.getByRole("region", { name: "Organization" }).textContent ?? "";

function type(testId: string, value: string) {
  const field = input(testId);
  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
}

function logoFile(content: BlobPart[], name: string, kind: string): File {
  return new NodeFile(content as never, name, { type: kind }) as unknown as File;
}

const PNG_START = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d]);

function chooseLogo(container: HTMLElement, file: File) {
  const chooser = container.ownerDocument.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(chooser, { target: { files: [file] } });
}

let RuntimeFormData: typeof FormData;

beforeAll(async () => {
  const form = await new Response("a=1", {
    headers: { "content-type": "application/x-www-form-urlencoded" },
  }).formData();
  RuntimeFormData = form.constructor as typeof FormData;
});

beforeEach(() => {
  requests.length = 0;
  vi.stubGlobal("FormData", RuntimeFormData);
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetSessionForTests();
});

// ------------------------------------------------------------------------ the list

describe("the organization list (R-3.1, R-3.21, R-8.28)", () => {
  it("shows a visitor the legal names and logos alone, with nothing to open or create", async () => {
    serve(() =>
      json(200, [listed("b", "Tidewater Analytics Inc."), { ...listed("a", "Aurora Data Collective"), logoImageFile: LOGO_ID }]),
    );
    resetSessionForTests({ status: "visitor" }, fakeIdentity());
    renderAt("/organizations");

    const names = await screen.findAllByTestId("organization-list-name");
    expect(names.map((name) => name.textContent)).toEqual(["Aurora Data Collective", "Tidewater Analytics Inc."]);
    expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual(["Organization"]);
    expect(screen.queryByTestId("organization-list-owner")).toBeNull();
    expect(screen.queryByTestId("organization-list-name-link")).toBeNull();
    expect(screen.queryByTestId("organization-create-link")).toBeNull();
    const logo = screen.getByRole("img", { name: "Aurora Data Collective logo" });
    expect(logo.getAttribute("src")).toBe(`/api/files/${LOGO_ID}?type=blob`);
    expect(requests.map((request) => `${request.method} ${request.path}`)).toEqual(["GET /api/organizations"]);
  });

  it("shows public sector staff the same single column", async () => {
    serve(() => json(200, [listed("a", "Aurora Data Collective")]));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/organizations");
    await screen.findAllByTestId("organization-list-name");
    expect(screen.getAllByRole("columnheader")).toHaveLength(1);
    expect(screen.queryByTestId("organization-list-my-organizations")).toBeNull();
  });

  it("fills a vendor's own rows only, links them, and offers Create and My organizations", async () => {
    serve(() =>
      json(200, [
        listed("a", "Aurora Data Collective"),
        listed(ORG_ID, "Northern Pines Digital Ltd.", {
          owner: { id: "o", name: "Blake Placeholder" },
          numTeamMembers: 3,
          swuQualified: true,
          twuQualified: false,
        }),
      ]),
    );
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt("/organizations");

    const rows = await screen.findAllByTestId("organization-list-row");
    expect(screen.getAllByRole("columnheader")).toHaveLength(5);
    expect(within(rows[0] as HTMLElement).queryByTestId("organization-list-owner")).toBeNull();
    expect(within(rows[0] as HTMLElement).queryByTestId("organization-swu-qualified-mark")).toBeNull();
    // Somebody else's row is its name alone: one cell across the table, no blank cells to read.
    const cells = within(rows[0] as HTMLElement).getAllByRole("cell");
    expect(cells).toHaveLength(1);
    expect(cells[0]?.getAttribute("colspan")).toBe("5");
    expect((rows[0] as HTMLElement).textContent).toBe("Aurora Data Collective");
    expect(within(rows[1] as HTMLElement).getAllByRole("cell")).toHaveLength(5);
    const mine = within(rows[1] as HTMLElement);
    expect(mine.getByTestId("organization-list-owner").textContent).toBe("Blake Placeholder");
    expect(mine.getByTestId("organization-list-team-size").textContent).toBe("3");
    expect(mine.getByTestId("organization-swu-qualified-mark").textContent).toBe("Yes");
    expect(mine.getByTestId("organization-twu-qualified-mark").textContent).toBe("No");
    expect(mine.getByTestId("organization-list-name-link").getAttribute("href")).toBe(`/organizations/${ORG_ID}/edit`);
    expect(screen.getByTestId("organization-create-link").getAttribute("href")).toBe("/organizations/create");
    expect(screen.getByTestId("organization-list-my-organizations").getAttribute("href")).toBe("/users/me?tab=organizations");
  });

  it("offers an administrator every row's details and no Create", async () => {
    serve(() =>
      json(200, [listed("a", "Aurora", { owner: { id: "o", name: "Owner" }, numTeamMembers: 1, swuQualified: false, twuQualified: false })]),
    );
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt("/organizations");
    expect((await screen.findByTestId("organization-list-owner")).textContent).toBe("Owner");
    expect(screen.queryByTestId("organization-create-link")).toBeNull();
  });

  it("is fifty to a page, and a page past the last shows the first", async () => {
    const many = Array.from({ length: 120 }, (_, index) => listed(`id-${index}`, `Organization ${String(index).padStart(3, "0")}`));
    serve(() => json(200, many));
    resetSessionForTests({ status: "visitor" }, fakeIdentity());
    const second = renderAt("/organizations?page=2");
    const names = await screen.findAllByTestId("organization-list-name");
    expect(names).toHaveLength(50);
    expect(names[0]?.textContent).toBe("Organization 050");
    const pagination = screen.getByTestId("organization-list-pagination");
    expect(pagination.textContent).toContain("Page 2 of 3");
    expect(within(pagination).getByRole("link", { name: "Page 2" }).getAttribute("aria-current")).toBe("page");
    second.unmount();

    renderAt("/organizations?page=9");
    expect((await screen.findAllByTestId("organization-list-name"))[0]?.textContent).toBe("Organization 000");
  });
});

// ------------------------------------------------------------------------ registering

describe("registering an organization (R-3.2, R-3.22, R-3.23)", () => {
  for (const [who, session] of [
    ["public sector staff", { status: "signed-in", account: staff }],
    ["an administrator", { status: "signed-in", account: administrator }],
    ["a vendor who has not accepted the terms", { status: "signed-in", account: vendorWithoutTerms }],
    ["a visitor", { status: "visitor" }],
  ] as const) {
    it(`is the missing page for ${who}, and nothing is asked`, async () => {
      serve(() => json(200, []));
      resetSessionForTests(session as never, fakeIdentity());
      renderAt("/organizations/create");
      await screen.findByTestId("not-found-page");
      expect(requests).toEqual([]);
    });
  }

  it("lets an empty form be submitted, then reports every required field and creates nothing", async () => {
    serve(() => json(200, []));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt("/organizations/create");

    const submit = (await screen.findByTestId("organization-submit-button")) as HTMLButtonElement;
    expect(submit.disabled).toBe(false);
    fireEvent.click(submit);
    await waitFor(() => expect(screen.getAllByTestId("field-error").length).toBeGreaterThan(0));
    const errors = screen.getAllByTestId("field-error").map((item) => item.textContent ?? "");
    expect(errors[0]).toBe("Legal name: enter the organization’s legal name");
    expect(errors.some((error) => error.startsWith("Contact email address"))).toBe(true);
    await waitFor(() => expect(document.activeElement?.id).toBe("org-submit-hint"));
    expect(requests.filter((request) => request.method !== "GET")).toEqual([]);
  });

  it("submitted with a skipped legal name and a malformed email, reports both and creates nothing", async () => {
    serve(() => json(200, []));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt("/organizations/create");

    const submit = (await screen.findByTestId("organization-submit-button")) as HTMLButtonElement;
    expect(screen.getByText("Fill in every required field to create the organization.")).toBeTruthy();

    type("organization-street-address-field", "100 Example Street");
    type("organization-city-field", "Victoria");
    type("organization-region-field", "British Columbia");
    type("organization-mail-code-field", "V0V 0V0");
    type("organization-country-field", "Canada");
    type("organization-contact-name-field", "Alex Placeholder");
    type("organization-contact-email-field", "not-an-email");

    const errors = screen.getAllByTestId("field-error").map((item) => item.textContent);
    expect(errors).toEqual([
      "Legal name: enter the organization’s legal name",
      "Contact email address: enter an email address in a valid format, like name@example.com",
    ]);
    expect(screen.getByText("Fix 2 fields to create the organization")).toBeTruthy();
    expect(submit.disabled).toBe(false);
    fireEvent.click(submit);
    await waitFor(() => expect(document.activeElement?.id).toBe("org-submit-hint"));
    expect(screen.getAllByTestId("field-error").map((item) => item.textContent)).toEqual(errors);
    expect(requests.filter((request) => request.method !== "GET")).toEqual([]);
    // The optional fields were left empty and raise nothing.
    expect(screen.getByTestId("organization-website-field").textContent).not.toContain("Enter the full website address");
  });

  it("creates the organization with the optional fields empty and opens its management page", async () => {
    serve((method, path) => {
      if (method === "POST" && path === "/api/organizations") return json(201, organization({ id: "new-org", legalName: "Northwind" }));
      return json(200, organization({ id: "new-org", legalName: "Northwind", numTeamMembers: 1 }));
    });
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const { router } = renderAt("/organizations/create");

    await screen.findByTestId("organization-submit-button");
    type("organization-legal-name-field", "Northwind");
    type("organization-street-address-field", "100 Example Street");
    type("organization-city-field", "Victoria");
    type("organization-region-field", "British Columbia");
    type("organization-mail-code-field", "V0V 0V0");
    type("organization-country-field", "Canada");
    type("organization-contact-name-field", "Alex Placeholder");
    type("organization-contact-email-field", "vendor.one@example.test");
    const submit = screen.getByTestId("organization-submit-button") as HTMLButtonElement;
    expect(submit.disabled).toBe(false);
    fireEvent.click(submit);

    expect((await screen.findByTestId("organization-identifier")).textContent).toBe("new-org");
    expect(router.state.location.pathname).toBe("/organizations/new-org/edit");
    expect(requests[0]).toMatchObject({
      method: "POST",
      path: "/api/organizations",
      body: {
        legalName: "Northwind",
        websiteUrl: "",
        streetAddress2: "",
        contactTitle: "",
        contactPhone: "",
        contactEmail: "vendor.one@example.test",
      },
    });
  });

  it("returns to the list on Cancel", async () => {
    serve(() => json(200, []));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const { router } = renderAt("/organizations/create");
    fireEvent.click(await screen.findByTestId("organization-create-cancel"));
    await waitFor(() => expect(router.state.location.pathname).toBe("/organizations"));
  });
});

describe("which problems the form shows", () => {
  it("shows a field once it is left, and a required one skipped over before a later field", () => {
    expect(shownProblems(EMPTY_PROFILE, new Set())).toEqual({});
    expect(Object.keys(shownProblems(EMPTY_PROFILE, new Set(["city"])))).toEqual(["legalName", "streetAddress1", "city"]);
  });
});

// ------------------------------------------------------------------------ the management page

describe("the management page's Organization tab (R-3.3, R-3.18, R-3.19)", () => {
  it("offers the owner Edit and Archive, with the profile read-only and the badges and identifier", async () => {
    serve(() => json(200, organization()));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit`);

    expect((await screen.findByTestId("organization-identifier")).textContent).toBe(ORG_ID);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Northern Pines Digital Ltd.");
    expect(screen.getByTestId("organization-swu-qualified-badge")).toBeTruthy();
    expect(screen.queryByTestId("organization-twu-qualified-badge")).toBeNull();
    expect(screen.getByTestId("organization-edit-button")).toBeTruthy();
    expect(screen.getByTestId("organization-archive-button")).toBeTruthy();
    // Both controls are part of the tab's own section, so reading the tab reads them.
    const tab = screen.getByRole("region", { name: "Organization" });
    expect(within(tab).getByRole("button", { name: "Edit organization" })).toBeTruthy();
    expect(within(tab).getByRole("button", { name: "Archive organization" })).toBeTruthy();
    expect(tabText()).toContain("Archive");
    // Read-only, the profile is text, not boxes, so the tab reads as its values.
    expect(screen.queryAllByRole("textbox")).toEqual([]);
    expect(shown("organization-contact-phone-field")).toBe("250-555-0101");
    for (const value of ["Northern Pines Digital Ltd.", "Victoria", "250-555-0101"]) expect(tabText()).toContain(value);
    expect(screen.getByTestId("organization-tab-organization").getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("No logo has been added.")).toBeTruthy();
    expect(screen.queryByTestId("organization-current-logo")).toBeNull();
  });

  it("offers an organization administrator who is not the owner neither Edit nor Archive", async () => {
    serve(() => json(200, organization({ viewerMembership: { membershipType: "ADMIN", membershipStatus: "ACTIVE" } })));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit`);
    await screen.findByTestId("organization-identifier");
    expect(screen.queryByTestId("organization-edit-button")).toBeNull();
    expect(screen.queryByTestId("organization-archive-button")).toBeNull();
    expect(screen.getByText("Only the organization’s owner can change these details.")).toBeTruthy();
    expect(tabText()).toContain("250-555-0101");
    expect(tabText()).not.toContain("Archive");
  });

  it("is the missing page when the service refuses it, for an archived organization, and for a visitor", async () => {
    serve(() => json(401, { errors: ["You are not permitted to read that organization."] }));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const refused = renderAt(`/organizations/${ORG_ID}/edit`);
    await screen.findByTestId("not-found-page");
    refused.unmount();

    serve(() => json(200, organization({ active: false })));
    const archived = renderAt(`/organizations/${ORG_ID}/edit`);
    await screen.findByTestId("not-found-page");
    archived.unmount();

    requests.length = 0;
    resetSessionForTests({ status: "visitor" }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit`);
    await screen.findByTestId("not-found-page");
    expect(requests).toEqual([]);
  });

  it("saves the contact phone number with every other field, and clearing it sends it empty", async () => {
    let stored = organization();
    serve((method, _path, body) => {
      if (method === "PUT") {
        const value = (body as { value: Record<string, string> }).value;
        stored = organization({ ...value, contactPhone: value.contactPhone || null });
      }
      return json(200, stored);
    });
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit`);

    fireEvent.click(await screen.findByTestId("organization-edit-button"));
    expect(screen.getByText("Clear this field to remove the number.")).toBeTruthy();
    type("organization-contact-phone-field", "250-555-0199");
    fireEvent.click(screen.getByTestId("organization-save-button"));
    await screen.findByTestId("organization-edit-button");
    expect(shown("organization-contact-phone-field")).toBe("250-555-0199");
    expect(tabText()).toContain("250-555-0199");
    expect(requests.at(-1)).toMatchObject({
      method: "PUT",
      path: `/api/organizations/${ORG_ID}`,
      body: { tag: "updateProfile", value: { contactPhone: "250-555-0199", legalName: "Northern Pines Digital Ltd." } },
    });

    fireEvent.click(screen.getByTestId("organization-edit-button"));
    type("organization-contact-phone-field", "");
    fireEvent.click(screen.getByTestId("organization-save-button"));
    await screen.findByTestId("organization-edit-button");
    expect((requests.at(-1)?.body as { value: Record<string, string> }).value.contactPhone).toBe("");
    expect(shown("organization-contact-phone-field")).toBe("Not entered");
    expect(tabText()).not.toContain("250-555-0199");
  });

  it("saves nothing when submitted with a field invalid, and Cancel saves nothing", async () => {
    serve(() => json(200, organization()));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit`);
    fireEvent.click(await screen.findByTestId("organization-edit-button"));
    type("organization-city-field", "");
    type("organization-website-field", "northwind");
    const save = screen.getByTestId("organization-save-button") as HTMLButtonElement;
    expect(save.disabled).toBe(false);
    fireEvent.click(save);
    await waitFor(() => expect(document.activeElement?.id).toBe("org-save-hint"));
    expect(screen.getByText("Fix 2 fields to save your changes")).toBeTruthy();
    expect(screen.getByTestId("organization-save-button")).toBeTruthy();
    fireEvent.click(screen.getByTestId("organization-cancel-edit-button"));
    expect(shown("organization-city-field")).toBe("Victoria");
    expect(requests.filter((request) => request.method !== "GET")).toEqual([]);
  });
});

describe("the logo (R-8.13, R-8.21, R-8.28, R-8.30)", () => {
  it("is stored when the form is saved, and then shown from its own address", async () => {
    let stored = organization();
    serve((method, path) => {
      if (path === "/api/avatars") return json(201, { id: LOGO_ID, name: "logo.png" });
      if (method === "PUT") stored = organization({ logoImageFile: LOGO_ID });
      return json(200, stored);
    });
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const { container } = renderAt(`/organizations/${ORG_ID}/edit`);
    fireEvent.click(await screen.findByTestId("organization-edit-button"));
    expect(screen.getByTestId("image-file-rule").textContent).toContain("Anyone can see the logo");

    chooseLogo(container, logoFile([PNG_START], "logo.png", "image/png"));
    await screen.findByText("logo.png is ready. Save your changes to use it as the logo.");
    fireEvent.click(screen.getByTestId("organization-save-button"));

    const logo = (await screen.findByTestId("organization-current-logo")) as HTMLImageElement;
    expect(logo.getAttribute("src")).toBe(`/api/files/${LOGO_ID}?type=blob`);
    expect(requests.filter((request) => request.method !== "GET").map((request) => `${request.method} ${request.path}`)).toEqual([
      "POST /api/avatars",
      `PUT /api/organizations/${ORG_ID}`,
    ]);
    const put = requests.find((request) => request.method === "PUT");
    expect((put?.body as { value: Record<string, string> }).value.logoImageFile).toBe(LOGO_ID);
  });

  it("is refused for a name not ending in .jpg, .jpeg or .png, keeping the form open and saving nothing", async () => {
    serve(() => json(200, organization({ logoImageFile: LOGO_ID })));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const { container } = renderAt(`/organizations/${ORG_ID}/edit`);
    fireEvent.click(await screen.findByTestId("organization-edit-button"));

    chooseLogo(container, logoFile(["GIF89a"], "northwind.gif", "image/gif"));
    const refusal = await screen.findByTestId("organization-logo-refused-error");
    expect(refusal.textContent).toContain("northwind.gif cannot be used as a logo");
    expect(refusal.textContent).toContain("Please select a different logo image.");
    fireEvent.click(screen.getByTestId("organization-save-button"));
    await act(async () => {});
    expect(screen.getByTestId("organization-logo-refused-error")).toBeTruthy();
    expect(screen.getByTestId("organization-save-button")).toBeTruthy();
    expect(requests.filter((request) => request.method !== "GET")).toEqual([]);
  });

  it("shows the service's refusal of a logo whose content is not an image, and saves nothing else", async () => {
    serve((_method, path) =>
      path === "/api/avatars"
        ? json(400, { errors: ["A profile picture or logo must be a JPEG or PNG image."] })
        : json(200, organization()),
    );
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const { container } = renderAt(`/organizations/${ORG_ID}/edit`);
    fireEvent.click(await screen.findByTestId("organization-edit-button"));
    chooseLogo(container, logoFile([PNG_START, "and then not an image"], "logo.png", "image/png"));
    await screen.findByText("logo.png is ready. Save your changes to use it as the logo.");
    fireEvent.click(screen.getByTestId("organization-save-button"));
    const refusal = await screen.findByTestId("organization-logo-refused-error");
    expect(refusal.textContent).toContain("must be a JPEG or PNG image");
    expect(requests.filter((request) => request.method !== "GET").map((request) => request.path)).toEqual(["/api/avatars"]);
  });
});

describe("archiving (R-3.6, R-3.24)", () => {
  it("asks an administrator first, saying the owner will be emailed, then archives and returns to the list", async () => {
    serve((method, path) => {
      if (method === "DELETE") return json(200, organization({ active: false }));
      if (path === "/api/organizations") return json(200, []);
      return json(200, organization({ viewerMembership: null }));
    });
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    const { router } = renderAt(`/organizations/${ORG_ID}/edit`);

    fireEvent.click(await screen.findByTestId("organization-archive-button"));
    const dialog = await screen.findByTestId("organization-archive-dialog");
    expect(dialog.textContent).toContain("Archive Northern Pines Digital Ltd.?");
    expect(dialog.textContent).toContain("Blake Placeholder, the owner, will be emailed that an administrator has archived it.");
    fireEvent.click(within(dialog).getByTestId("organization-archive-confirm"));

    await waitFor(() => expect(router.state.location.pathname).toBe("/organizations"));
    expect(requests.some((request) => request.method === "DELETE" && request.path === `/api/organizations/${ORG_ID}`)).toBe(true);
  });

  it("does not tell the owner archiving their own that anyone will be emailed", async () => {
    serve(() => json(200, organization()));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit`);
    fireEvent.click(await screen.findByTestId("organization-archive-button"));
    const dialog = await screen.findByTestId("organization-archive-dialog");
    expect(dialog.textContent).not.toContain("will be emailed");
    fireEvent.click(within(dialog).getByTestId("organization-dialog-cancel"));
    await waitFor(() => expect(screen.queryByTestId("organization-archive-dialog")).toBeNull());
    expect(requests.filter((request) => request.method === "DELETE")).toEqual([]);
  });
});

// ------------------------------------------------------------------------ accessibility

async function problemsIn(container: HTMLElement): Promise<string[]> {
  const results = await axe.run(container, {
    resultTypes: ["violations"],
    // Needs a browser to measure; nothing here sets a colour.
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
}

describe("the organization screens have nothing a machine can find to answer for (WCAG 2.1 AA)", () => {
  it("on the list, as a vendor", async () => {
    serve(() =>
      json(200, [
        { ...listed("a", "Aurora"), logoImageFile: LOGO_ID },
        listed(ORG_ID, "Northern Pines", { owner: { id: "o", name: "Blake" }, numTeamMembers: 3, swuQualified: true, twuQualified: true }),
      ]),
    );
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const { container } = renderAt("/organizations");
    await screen.findAllByTestId("organization-list-row");
    expect(await problemsIn(container)).toEqual([]);
  }, 30_000);

  it("on the registration form with problems showing", async () => {
    serve(() => json(200, []));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const { container } = renderAt("/organizations/create");
    await screen.findByTestId("organization-submit-button");
    type("organization-contact-email-field", "not-an-email");
    expect(await problemsIn(container)).toEqual([]);
  }, 30_000);

  it("on the Organization tab, read-only and editing", async () => {
    serve(() => json(200, organization({ logoImageFile: LOGO_ID })));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const { container } = renderAt(`/organizations/${ORG_ID}/edit`);
    await screen.findByTestId("organization-current-logo");
    expect(await problemsIn(container)).toEqual([]);
    fireEvent.click(screen.getByTestId("organization-edit-button"));
    await screen.findByTestId("organization-save-button");
    expect(await problemsIn(container)).toEqual([]);
  }, 30_000);
});

// ------------------------------------------------------------------------ one's own organizations

describe("the person's own organizations (R-3.6, R-3.23)", () => {
  it("lists those they own with the team counted, and those they belong to or are invited to", async () => {
    serve(() =>
      json(200, [
        {
          id: "m1",
          membershipType: "OWNER",
          membershipStatus: "ACTIVE",
          organization: { id: "org-1", legalName: "Northwind", numTeamMembers: 1, swuQualified: false },
        },
        {
          id: "m2",
          membershipType: "MEMBER",
          membershipStatus: "ACTIVE",
          organization: { id: "org-2", legalName: "Aurora", numTeamMembers: 3, swuQualified: true },
        },
        {
          id: "m3",
          membershipType: "MEMBER",
          membershipStatus: "PENDING",
          organization: { id: "org-3", legalName: "Tidewater", numTeamMembers: 2, swuQualified: false },
        },
      ]),
    );
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt("/users/me?tab=organizations");

    const owned = await screen.findByTestId("membership-owned-table");
    expect(within(owned).getByTestId("membership-organization-link").getAttribute("href")).toBe("/organizations/org-1/edit");
    expect(within(owned).getByTestId("membership-team-member-count").textContent).toBe("1");
    const affiliated = screen.getByTestId("membership-affiliated-table");
    expect(within(affiliated).queryByTestId("membership-organization-link")).toBeNull();
    expect(affiliated.textContent).toContain("Aurora");
    expect(within(affiliated).getByTestId("organization-pending-badge").textContent).toBe("Pending");
    expect(requests.map((request) => `${request.method} ${request.path}`)).toEqual(["GET /api/affiliations"]);
  });

  it("says so in words when there are none", async () => {
    serve(() => json(200, []));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt("/users/me?tab=organizations");
    expect(await screen.findByTestId("membership-empty-owned")).toBeTruthy();
    expect(screen.getByTestId("membership-empty-affiliated")).toBeTruthy();
    expect(screen.getByTestId("organization-create-link").getAttribute("href")).toBe("/organizations/create");
  });
});
