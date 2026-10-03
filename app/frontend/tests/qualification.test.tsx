import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Account } from "../src/api/accounts";
import type { IdentityClient } from "../src/auth/identity-client";
import { resetSessionForTests } from "../src/auth/session";
import { routeTree } from "../src/router";

/**
 * Qualifying for Sprint With Us and Team With Us as the screens show it: the management page's two
 * qualification tabs, the administrator's service-area approvals, and the two program terms pages
 * with their one-time acceptance (R-3.25–R-3.28). The service is stood in for.
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

const organization = (overrides: Record<string, unknown> = {}) => ({
  id: ORG_ID,
  createdAt: "2026-01-05T17:00:00.000Z",
  updatedAt: "2026-01-05T17:00:00.000Z",
  legalName: "Northern Pines Digital Ltd.",
  logoImageFile: null,
  websiteUrl: null,
  streetAddress1: "100 Placeholder Way",
  streetAddress2: null,
  city: "Victoria",
  region: "BC",
  mailCode: "V0V0V0",
  country: "Canada",
  contactName: "Blake Placeholder",
  contactTitle: null,
  contactEmail: "org.owner@example.test",
  contactPhone: null,
  active: true,
  deactivatedOn: null,
  deactivatedBy: null,
  acceptedSWUTerms: null,
  acceptedTWUTerms: null,
  owner: { id: owner.id, name: owner.name },
  numTeamMembers: 2,
  swuQualified: false,
  twuQualified: false,
  serviceAreas: [],
  swuRequirements: { twoMembers: true, allCapabilities: true, termsAccepted: false },
  viewerMembership: { membershipType: "OWNER", membershipStatus: "ACTIVE" },
  changelog: [],
  ...overrides,
});

const termsPage = (slug: string) => ({
  id: slug,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  slug,
  title: "Terms",
  body: "These are the program's terms.",
  fixed: true,
});

const requests: { method: string; path: string; body: unknown }[] = [];

function serve(handler: (method: string, path: string, body: unknown) => Response | Promise<Response>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: Request) => {
      const type = input.headers.get("content-type") ?? "";
      const body = type.includes("application/json") ? JSON.parse(await input.clone().text()) : undefined;
      const url = new URL(input.url);
      requests.push({ method: input.method, path: url.pathname, body });
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

const requirement = (testId: string) => screen.getByTestId(testId).textContent ?? "";

afterEach(() => {
  requests.length = 0;
  vi.unstubAllGlobals();
});

describe("the Sprint With Us qualification tab (R-3.25, R-3.27)", () => {
  it("shows team size and capabilities met, the terms unmet, and the organization not qualified", async () => {
    serve(() => json(200, organization()));
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit?tab=swu-qualification`);

    expect(await screen.findByTestId("organization-not-qualified-notice")).toBeTruthy();
    expect(requirement("organization-swu-requirement-two-members")).toMatch(/^Met/);
    expect(requirement("organization-swu-requirement-all-capabilities")).toMatch(/^Met/);
    expect(requirement("organization-swu-requirement-terms-accepted")).toMatch(/^Not met/);
    expect(screen.queryByTestId("organization-swu-qualified-badge")).toBeNull();
    const link = screen.getByTestId("organization-view-swu-terms-link");
    expect(link.getAttribute("href")).toBe(`/organizations/${ORG_ID}/sprint-with-us-terms-and-conditions`);
    expect(link.textContent).toContain("Read and accept");
    expect(screen.getByTestId("organization-tab-swu-qualification").getAttribute("aria-current")).toBe("page");
  });

  it("marks a qualified organization and says when the terms were accepted", async () => {
    serve(() =>
      json(
        200,
        organization({
          swuQualified: true,
          acceptedSWUTerms: "2026-09-01T10:30:00.000Z",
          swuRequirements: { twoMembers: true, allCapabilities: true, termsAccepted: true },
        }),
      ),
    );
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit?tab=swu-qualification`);

    expect(await screen.findByTestId("organization-swu-qualified-badge")).toBeTruthy();
    expect(screen.queryByTestId("organization-not-qualified-notice")).toBeNull();
    expect(requirement("organization-swu-requirement-terms-accepted")).toMatch(/^Met/);
    expect(screen.getByTestId("organization-swu-terms-accepted-on").textContent).toBe(
      "Accepted on September 1, 2026 at 10:30 a.m.",
    );
    expect(screen.getByTestId("organization-view-swu-terms-link").textContent).not.toContain("accept");
  });
});

describe("the Team With Us qualification tab (R-3.26, R-3.28)", () => {
  it("shows the owner the approved area as met, the terms unmet, and no way to change the areas", async () => {
    serve(() => json(200, organization({ serviceAreas: ["FULL_STACK_DEVELOPER"] })));
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit?tab=twu-qualification`);

    expect(await screen.findByTestId("organization-not-qualified-notice")).toBeTruthy();
    expect(requirement("organization-twu-requirement-service-area")).toMatch(/^Met/);
    expect(requirement("organization-twu-requirement-terms-accepted")).toMatch(/^Not met/);
    expect(screen.getAllByTestId("organization-service-area").map((area) => area.textContent)).toEqual(["Full stack developer"]);
    expect(screen.queryByTestId("organization-edit-service-areas-button")).toBeNull();
    expect(screen.getByTestId("organization-view-twu-terms-link").textContent).toContain("Read and accept");
  });

  it("lets an administrator replace the approvals with exactly the areas ticked", async () => {
    let areas = ["FULL_STACK_DEVELOPER", "DATA_PROFESSIONAL"];
    serve((method, _path, body) => {
      if (method === "PUT") areas = [...((body as { value: string[] }).value ?? [])].sort();
      return json(200, organization({ serviceAreas: areas, viewerMembership: null }));
    });
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/edit?tab=twu-qualification`);

    fireEvent.click(await screen.findByTestId("organization-edit-service-areas-button"));
    const boxes = screen.getAllByTestId("organization-service-area-checkbox");
    expect(boxes).toHaveLength(5);
    // Labelled and valued as the catalogue story draws them.
    expect(boxes.map((element) => element.textContent?.trim())).toEqual([
      "Full stack developer",
      "Data professional",
      "Agile coach",
      "DevOps specialist",
      "Service designer",
    ]);
    expect(boxes.map((element) => element.querySelector("input")?.getAttribute("value"))).toEqual([
      "full-stack-developer",
      "data-professional",
      "agile-coach",
      "devops-specialist",
      "service-designer",
    ]);
    const box = (name: string) => screen.getByRole("checkbox", { name }) as HTMLInputElement;
    expect(box("Full stack developer").checked).toBe(true);
    expect(box("Data professional").checked).toBe(true);
    expect(box("Agile coach").checked).toBe(false);
    fireEvent.click(box("Data professional"));
    fireEvent.click(box("Agile coach"));
    fireEvent.click(screen.getByTestId("organization-save-service-areas-button"));

    await waitFor(() => expect(screen.getAllByTestId("organization-service-area")).toHaveLength(2));
    const put = requests.find((request) => request.method === "PUT");
    expect(put?.body).toEqual({ tag: "qualifyServiceAreas", value: ["FULL_STACK_DEVELOPER", "AGILE_COACH"] });
    expect(screen.getAllByTestId("organization-service-area").map((area) => area.textContent)).toEqual([
      "Agile coach",
      "Full stack developer",
    ]);
    expect(screen.getByTestId("organization-view-twu-terms-link").textContent).not.toContain("accept");
  });
});

describe("the program terms pages (R-3.27)", () => {
  it("shows the owner the terms and records their acceptance, then returns to the qualification tab", async () => {
    let accepted: string | null = null;
    serve((method, path) => {
      if (path === "/api/content/sprint-with-us-terms-and-conditions") return json(200, termsPage("sprint-with-us-terms-and-conditions"));
      if (method === "PUT") accepted = "2026-10-03T17:00:00.000Z";
      return json(200, organization({ acceptedSWUTerms: accepted }));
    });
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    const { router } = renderAt(`/organizations/${ORG_ID}/sprint-with-us-terms-and-conditions`);

    expect(await screen.findByRole("heading", { level: 1, name: "Sprint With Us Terms & Conditions" })).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId("organization-terms-body").textContent).toContain("These are the program's terms."));
    expect(screen.queryByTestId("organization-terms-accepted-on")).toBeNull();
    fireEvent.click(screen.getByTestId("organization-accept-terms-button"));

    await waitFor(() => expect(router.state.location.pathname).toBe(`/organizations/${ORG_ID}/edit`));
    expect(router.state.location.search).toEqual({ tab: "swu-qualification" });
    expect(requests.find((request) => request.method === "PUT")?.body).toEqual({ tag: "acceptSWUTerms" });
    expect((await screen.findByTestId("organization-swu-terms-accepted-on")).textContent).toContain("October 3, 2026");
  });

  it("says when accepted terms were accepted and offers Accept no more", async () => {
    serve((_method, path) =>
      path.startsWith("/api/content/")
        ? json(200, termsPage("team-with-us-terms-and-conditions"))
        : json(200, organization({ acceptedTWUTerms: "2026-09-01T10:30:00.000Z" })),
    );
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/team-with-us-terms-and-conditions`);

    expect((await screen.findByTestId("organization-terms-accepted-on")).textContent).toBe(
      "Northern Pines Digital Ltd. accepted these terms on September 1, 2026 at 10:30 a.m.",
    );
    expect(screen.queryByTestId("organization-accept-terms-button")).toBeNull();
    expect(screen.getByTestId("organization-terms-cancel").textContent).toBe("Back to the organization");
  });

  it("does not offer an administrator Accept", async () => {
    serve((_method, path) =>
      path.startsWith("/api/content/")
        ? json(200, termsPage("sprint-with-us-terms-and-conditions"))
        : json(200, organization({ viewerMembership: null })),
    );
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/sprint-with-us-terms-and-conditions`);

    expect(await screen.findByTestId("organization-terms-body")).toBeTruthy();
    expect(screen.queryByTestId("organization-accept-terms-button")).toBeNull();
    expect(document.body.textContent).toContain("Only the organization’s own people can accept them.");
  });

  it("shows the refusal of a second acceptance made from a page opened before the first", async () => {
    serve((method, path) => {
      if (path.startsWith("/api/content/")) return json(200, termsPage("sprint-with-us-terms-and-conditions"));
      if (method === "PUT") {
        return json(400, { errors: ["The Sprint With Us terms and conditions have already been accepted for this organization."] });
      }
      return json(200, organization());
    });
    resetSessionForTests({ status: "signed-in", account: owner }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/sprint-with-us-terms-and-conditions`);

    fireEvent.click(await screen.findByTestId("organization-accept-terms-button"));
    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText(/already been accepted/)).toBeTruthy();
  });

  it("is the missing page to someone the organization's record is refused to", async () => {
    serve(() => json(401, { permissions: ["You are not permitted to read that organization."] }));
    resetSessionForTests({ status: "signed-in", account: account({ id: "someone-else" }) }, fakeIdentity());
    renderAt(`/organizations/${ORG_ID}/team-with-us-terms-and-conditions`);
    await waitFor(() => expect(screen.queryByTestId("organization-terms-body")).toBeNull());
    expect(await screen.findByRole("heading", { level: 1 })).toBeTruthy();
    expect(screen.queryByTestId("organization-accept-terms-button")).toBeNull();
  });
});
