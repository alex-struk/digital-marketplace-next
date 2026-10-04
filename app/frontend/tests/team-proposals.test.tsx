import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Account } from "../src/api/accounts";
import type { IdentityClient } from "../src/auth/identity-client";
import { resetSessionForTests } from "../src/auth/session";
import { routeTree } from "../src/router";
import { teamMemberChoices } from "../src/screens/proposal-team-form";

/**
 * Proposing on Sprint With Us and Team With Us opportunities, as the screens do it
 * (proposal-swu-create, proposal-twu-create, proposal-swu-edit, the vendor's dashboard, the
 * Proposals tab of the manage pages and the attachment control on those programs' forms). The
 * service is stood in for; what is checked is what the screens show and what they ask of it.
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

const vendor = account({});
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

const OPPORTUNITY = "00000000-0000-4000-8000-000000000911";
const PROPOSAL = "00000000-0000-4000-8000-000000000b01";
const ORGANIZATION = "00000000-0000-4000-8000-000000000301";
const OTHER_ORGANIZATION = "00000000-0000-4000-8000-000000000304";
const RESOURCE = "00000000-0000-4000-8000-000000000921";

const sprint = (overrides: Record<string, unknown> = {}) => ({
  id: OPPORTUNITY,
  program: "sprint-with-us",
  createdAt: "2026-10-01T17:00:00.000Z",
  updatedAt: "2026-10-01T17:00:00.000Z",
  status: "PUBLISHED",
  publishedAt: "2026-10-01T18:00:00.000Z",
  title: "Modernize the licence renewal service",
  teaser: "",
  location: "Victoria",
  remoteOk: false,
  remoteDesc: "",
  description: "Licence holders renew on paper today.",
  proposalDeadline: "2030-10-16",
  assignmentDate: "2030-10-23",
  totalMaxBudget: 500_000,
  mandatorySkills: ["React"],
  inceptionPhase: null,
  prototypePhase: { phase: "PROTOTYPE", startDate: "2030-11-02", completionDate: "2031-01-29", maxBudget: 200_000, requiredCapabilities: ["User Research"] },
  implementationPhase: { phase: "IMPLEMENTATION", startDate: "2031-02-01", completionDate: "2031-09-30", maxBudget: 300_000, requiredCapabilities: [] },
  teamQuestions: [{ question: "Why you?", guideline: "Fit.", score: 5, minimumScore: null, wordLimit: 3, order: 0 }],
  questionsWeight: 25,
  codeChallengeWeight: 25,
  scenarioWeight: 25,
  priceWeight: 25,
  subscribed: false,
  attachments: [],
  addenda: [],
  ...overrides,
});

const team = (overrides: Record<string, unknown> = {}) => ({
  ...sprint(),
  program: "team-with-us",
  title: "Data platform team",
  totalMaxBudget: undefined,
  maxBudget: 10_000,
  startDate: "2030-11-04",
  completionDate: "2030-12-01",
  resources: [{ id: RESOURCE, serviceArea: "DATA_PROFESSIONAL", targetAllocation: 50, order: 0 }],
  resourceQuestions: [{ question: "How?", guideline: "", score: 5, minimumScore: null, wordLimit: 50, order: 0 }],
  challengeWeight: 50,
  ...overrides,
});

const organization = (overrides: Record<string, unknown> = {}) => ({
  id: ORGANIZATION,
  legalName: "Northern Pines Digital Ltd.",
  active: true,
  swuQualified: true,
  twuQualified: true,
  serviceAreas: ["FULL_STACK_DEVELOPER"],
  ...overrides,
});

const member = (id: string, name: string, membershipStatus: string, capabilities: string[]) => ({
  id: `affiliation-${id}`,
  membershipType: "MEMBER",
  membershipStatus,
  user: { id, name, capabilities },
});

const members = [
  member("u-owner", "Blake Placeholder", "ACTIVE", ["Backend Development"]),
  member("u-researcher", "Dana Placeholder", "ACTIVE", ["User Research"]),
  member("u-pending", "Quinn Placeholder", "PENDING", ["User Research"]),
];

const swuProposal = (overrides: Record<string, unknown> = {}) => ({
  id: PROPOSAL,
  program: "sprint-with-us",
  createdAt: "2026-10-02T17:00:00.000Z",
  updatedAt: "2026-10-02T17:00:00.000Z",
  createdBy: { id: vendor.id, name: vendor.name },
  updatedBy: { id: vendor.id, name: vendor.name },
  status: "SUBMITTED",
  submittedAt: "2026-10-02T17:00:00.000Z",
  opportunity: { id: OPPORTUNITY, title: "Modernize the licence renewal service", status: "PUBLISHED", proposalDeadline: "2030-10-16", totalMaxBudget: 500_000 },
  organization: { id: ORGANIZATION, legalName: "Northern Pines Digital Ltd." },
  totalProposedCost: 400_000,
  prototypePhase: { members: [{ member: { id: "u-researcher", name: "Dana Placeholder" }, scrumMaster: true }], proposedCost: 100_000 },
  implementationPhase: { members: [{ member: { id: "u-owner", name: "Blake Placeholder" }, scrumMaster: true }], proposedCost: 300_000 },
  inceptionPhase: null,
  teamQuestionResponses: [{ order: 0, response: "We fit." }],
  references: [],
  attachments: [],
  anonymousProponentName: "",
  history: [
    { createdAt: "2026-10-02T17:00:00.000Z", createdBy: { id: vendor.id, name: vendor.name }, status: "SUBMITTED", event: null, note: null },
    { createdAt: "2026-10-01T17:00:00.000Z", createdBy: { id: vendor.id, name: vendor.name }, status: "DRAFT", event: null, note: null },
  ],
  ...overrides,
});

const requests: { method: string; address: string; body: unknown }[] = [];

function serve(handler: (method: string, path: string, body: unknown, search: string) => Response | Promise<Response>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: Request) => {
      const type = input.headers.get("content-type") ?? "";
      const body = type.includes("application/json") ? JSON.parse(await input.clone().text()) : undefined;
      const url = new URL(input.url);
      requests.push({ method: input.method, address: `${url.pathname}${url.search}`, body });
      return handler(input.method, url.pathname, body, url.search);
    }),
  );
}

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function renderAt(address: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [address] }) });
  const view = render(<RouterProvider router={router as never} />);
  return { ...view, router };
}

/** The native select a design-system Select keeps beside its button, found by the Select's label. */
function selectLabelled(label: string): HTMLSelectElement {
  const found = Array.from(document.querySelectorAll("select")).find((select) => select.closest("label")?.textContent?.includes(label) || select.getAttribute("aria-label") === label);
  if (found) return found as HTMLSelectElement;
  const labelElement = screen.getAllByText(label)[0] as HTMLElement;
  let container: HTMLElement | null = labelElement;
  while (container && !container.querySelector("select")) container = container.parentElement;
  return container?.querySelector("select") as HTMLSelectElement;
}

function choose(label: string, value: string) {
  fireEvent.change(selectLabelled(label), { target: { value } });
}

const input = (element: HTMLElement) => element.querySelector("input, textarea") as HTMLInputElement;

/** The service as a create page meets it: the opportunity, no proposal yet, one organization and its people. */
function aNewProposal(program: "sprint-with-us" | "team-with-us", opportunity: unknown, extra: Record<string, unknown> = {}) {
  serve((method, path) => {
    if (method !== "GET") return json(201, swuProposal({ status: "DRAFT" }));
    if (path === `/api/opportunities/${program}/${OPPORTUNITY}`) return json(200, opportunity);
    if (path === "/api/ownedOrganizations") return json(200, [{ id: ORGANIZATION, legalName: "Northern Pines Digital Ltd." }]);
    if (path === `/api/organizations/${ORGANIZATION}`) return json(200, organization(extra));
    if (path === "/api/affiliations") return json(200, members);
    return json(200, []);
  });
}

beforeEach(() => {
  requests.length = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetSessionForTests();
});

describe("the people a team may name (R-2.18)", () => {
  const people = members.map((entry) => ({
    affiliationId: entry.id,
    userId: entry.user.id,
    name: entry.user.name,
    capabilities: entry.user.capabilities,
    membershipType: "MEMBER" as const,
    membershipStatus: entry.membershipStatus as "ACTIVE" | "PENDING",
  }));

  it("offers Sprint With Us pending invitees, marked, and Team With Us active members only, never one already named", () => {
    expect(teamMemberChoices("sprint-with-us", people, ["u-owner"]).map((choice) => choice.label)).toEqual(["Dana Placeholder", "Quinn Placeholder (pending)"]);
    expect(teamMemberChoices("team-with-us", people, ["u-owner"]).map((choice) => choice.label)).toEqual(["Dana Placeholder"]);
  });
});

describe("the Sprint With Us create page (R-2.1, R-2.18, R-2.19, R-2.21)", () => {
  const CREATE = `/opportunities/sprint-with-us/${OPPORTUNITY}/proposals/create`;

  it("is the missing page for public sector staff, and asks the service for no proposal", async () => {
    aNewProposal("sprint-with-us", sprint());
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt(CREATE);
    await screen.findByTestId("not-found-page");
    expect(requests.filter((request) => request.address.startsWith("/api/proposals"))).toEqual([]);
  });

  it("offers a team for each of the opportunity's phases only, and holds back submission while one is incomplete or over budget", async () => {
    aNewProposal("sprint-with-us", sprint());
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(CREATE);
    const sections = await screen.findAllByTestId("proposal-phase-team");
    expect(sections.map((section) => section.querySelector("legend")?.textContent)).toEqual(["Prototype phase", "Implementation phase"]);
    // The only organization is chosen already, and its people are offered once they are read.
    await waitFor(() => expect(Array.from(selectLabelled("Team member to add to the prototype phase").options).map((option) => option.textContent)).toContain("Quinn Placeholder (pending)"));
    expect(screen.getByTestId("proposal-submit").hasAttribute("disabled")).toBe(true);

    choose("Team member to add to the prototype phase", "u-pending");
    fireEvent.click(screen.getAllByTestId("proposal-add-team-member")[0]!);
    expect(await screen.findByTestId("proposal-pending-team-member")).toBeTruthy();
    const prototype = screen.getAllByTestId("proposal-phase-requirements")[0]!;
    expect(prototype.textContent).toContain("must be confirmed (not pending) members");
    expect(prototype.textContent).toContain("User Research: not held");

    choose("Team member to add to the prototype phase", "u-researcher");
    fireEvent.click(screen.getAllByTestId("proposal-add-team-member")[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Remove Quinn Placeholder from the prototype phase" }));
    await waitFor(() => expect(screen.getAllByTestId("proposal-phase-requirements")[0]!.textContent).toContain("meets its requirements"));

    choose("Team member to add to the implementation phase", "u-owner");
    fireEvent.click(screen.getAllByTestId("proposal-add-team-member")[1]!);
    const costs = screen.getAllByTestId("proposal-phase-cost-field");
    fireEvent.change(input(costs[0]!), { target: { value: "250000" } });
    fireEvent.blur(input(costs[0]!));
    fireEvent.change(input(costs[1]!), { target: { value: "300000" } });
    fireEvent.blur(input(costs[1]!));
    await waitFor(() => expect(screen.getAllByTestId("proposal-phase-cost-field")[0]!.textContent).toContain("Please enter a Proposed Cost less than or equal to 200,000."));
    expect(screen.getByTestId("proposal-budget-exceeded-error").textContent).toBe("The proposed cost exceeds the maximum budget for this opportunity.");
    expect(screen.getByTestId("proposal-submit").hasAttribute("disabled")).toBe(true);

    fireEvent.change(input(screen.getAllByTestId("proposal-phase-cost-field")[0]!), { target: { value: "150000" } });
    fireEvent.blur(input(screen.getAllByTestId("proposal-phase-cost-field")[0]!));
    await waitFor(() => expect(screen.getByTestId("proposal-submit").hasAttribute("disabled")).toBe(false));

    // No scrum master is chosen yet, and the answer is over its word limit: both are named before the terms are asked for.
    fireEvent.change(input(screen.getByTestId("proposal-question-response-field")), { target: { value: "one two three four" } });
    fireEvent.click(screen.getByTestId("proposal-submit"));
    const errors = await screen.findAllByTestId("field-error");
    expect(errors.map((error) => error.textContent)).toEqual([
      "Prototype phase: Please select a scrum master for this phase.",
      "Implementation phase: Please select a scrum master for this phase.",
      "Question 1: Response must be between 1 and 3 words long.",
    ]);
    expect(screen.queryByTestId("proposal-terms-dialog")).toBeNull();
  });

  it("has nothing to answer for once a team is named", async () => {
    aNewProposal("sprint-with-us", sprint());
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const { container } = renderAt(CREATE);
    await waitFor(() => expect(Array.from(selectLabelled("Team member to add to the prototype phase").options).length).toBeGreaterThan(1));
    choose("Team member to add to the prototype phase", "u-pending");
    fireEvent.click(screen.getAllByTestId("proposal-add-team-member")[0]!);
    await screen.findByTestId("proposal-pending-team-member");
    const results = await axe.run(container, { resultTypes: ["violations"], rules: { "color-contrast": { enabled: false } } });
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  });

  it("saves a draft with its team, scrum masters and costs as the service names them", async () => {
    aNewProposal("sprint-with-us", sprint());
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(CREATE);
    await waitFor(() => expect(Array.from(selectLabelled("Team member to add to the implementation phase").options).length).toBeGreaterThan(1));
    choose("Team member to add to the implementation phase", "u-owner");
    fireEvent.click(screen.getAllByTestId("proposal-add-team-member")[1]!);
    fireEvent.click(within(await screen.findByRole("radiogroup", { name: "Scrum master for the implementation phase" })).getByRole("radio"));
    fireEvent.click(screen.getByTestId("proposal-save-draft"));
    await waitFor(() => expect(requests.some((request) => request.method === "POST")).toBe(true));
    const created = requests.find((request) => request.method === "POST");
    expect(created?.address).toBe("/api/proposals/sprint-with-us");
    expect(created?.body).toMatchObject({
      opportunity: OPPORTUNITY,
      status: "DRAFT",
      organization: ORGANIZATION,
      prototypePhase: { members: [], proposedCost: null },
      implementationPhase: { members: [{ member: "u-owner", scrumMaster: true }], proposedCost: null },
      attachments: [],
    });
  });

  it("asks each reference for its name, company, email address and phone number, and sends the company to the service", async () => {
    aNewProposal("sprint-with-us", sprint());
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(CREATE);
    fireEvent.click(await screen.findByTestId("proposal-add-reference"));
    const reference = await screen.findByRole("group", { name: "Reference 1" });
    const box = (label: string) => within(reference).getByLabelText(label, { exact: false }) as HTMLInputElement;
    fireEvent.change(box("Name"), { target: { value: "Robin Placeholder" } });
    fireEvent.change(box("Company"), { target: { value: "Placeholder Works Ltd." } });
    fireEvent.change(box("Email address"), { target: { value: "robin@example.com" } });
    fireEvent.change(box("Phone number"), { target: { value: "250-555-0100" } });
    fireEvent.click(screen.getByTestId("proposal-save-draft"));
    await waitFor(() => expect(requests.some((request) => request.method === "POST")).toBe(true));
    expect(requests.find((request) => request.method === "POST")?.body).toMatchObject({
      references: [{ name: "Robin Placeholder", company: "Placeholder Works Ltd.", email: "robin@example.com", phone: "250-555-0100" }],
    });
  });

  it("says an unqualified organization cannot submit, and points to the proposal already naming an organization (R-2.11, R-2.16)", async () => {
    serve((method, path) => {
      if (method === "POST") {
        return json(400, { errors: ["organization: Please select a different organization."], existingOrganizationProposal: { proposalId: "existing-one" } });
      }
      if (path === `/api/opportunities/sprint-with-us/${OPPORTUNITY}`) return json(200, sprint());
      if (path === "/api/ownedOrganizations") return json(200, [{ id: ORGANIZATION, legalName: "Northern Pines Digital Ltd." }]);
      if (path === `/api/organizations/${ORGANIZATION}`) return json(200, organization({ swuQualified: false }));
      if (path === "/api/affiliations") return json(200, members);
      return json(200, []);
    });
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(CREATE);
    expect((await screen.findByTestId("proposal-unqualified-organization-notice")).textContent).toContain("not qualified for Sprint With Us");
    fireEvent.click(screen.getByTestId("proposal-save-draft"));
    const errors = await screen.findAllByTestId("field-error");
    expect(errors.map((error) => error.textContent)).toEqual(["Organization: Please select a different organization."]);
    expect(screen.getByRole("link", { name: "Open the existing proposal" }).getAttribute("href")).toBe(
      `/opportunities/sprint-with-us/${OPPORTUNITY}/proposals/existing-one/edit`,
    );
  });
});

describe("the Team With Us create page (R-2.10, R-2.17, R-2.20)", () => {
  const CREATE = `/opportunities/team-with-us/${OPPORTUNITY}/proposals/create`;

  it("says what the organization lacks and what the rates come to, and names the team's problems before the terms", async () => {
    aNewProposal("team-with-us", team());
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(CREATE);
    expect((await screen.findByTestId("proposal-service-area-error")).textContent).toContain("does not provide Data professional");
    await waitFor(() => expect(Array.from(selectLabelled("Team member to add to resource 1").options).map((option) => option.textContent)).not.toContain("Quinn Placeholder (pending)"));

    choose("Team member to add to resource 1", "u-owner");
    fireEvent.click(screen.getByTestId("proposal-add-team-member"));
    // Named once, a person is offered no more.
    await waitFor(() => expect(Array.from(selectLabelled("Team member to add to resource 1").options).map((option) => option.value)).not.toContain("u-owner"));
    const rate = await screen.findByTestId("proposal-hourly-rate-field");
    // Twenty working days at 7.5 hours, half time, at $200: $15,000 against $10,000.
    fireEvent.change(input(rate), { target: { value: "200" } });
    fireEvent.blur(input(rate));
    await waitFor(() => expect(screen.getByTestId("proposal-budget-exceeded-error").textContent).toContain("$15,000"));

    fireEvent.click(screen.getByTestId("proposal-submit"));
    const errors = await screen.findAllByTestId("field-error");
    expect(errors.map((error) => error.textContent)).toEqual([
      "Organization: The selected organization does not satisfy this opportunity's service areas.",
      "Cost: The proposed cost exceeds the maximum budget for this opportunity.",
      "Question 1: Response must be between 1 and 50 words long.",
    ]);
    expect(screen.queryByTestId("proposal-terms-dialog")).toBeNull();
  });
});

describe("the Sprint With Us manage page (R-2.9, R-2.22)", () => {
  const MANAGE = `/opportunities/sprint-with-us/${OPPORTUNITY}/proposals/${PROPOSAL}/edit`;

  it("shows the organization, keeps the change of a submitted proposal's organization the service refused, and lists its history", async () => {
    serve((method, path) => {
      if (method === "PUT") return json(400, { errors: ["organization: Organization cannot be changed once the proposal has been submitted"] });
      if (path === `/api/proposals/sprint-with-us/${PROPOSAL}`) return json(200, swuProposal());
      if (path === `/api/opportunities/sprint-with-us/${OPPORTUNITY}`) return json(200, sprint());
      if (path === "/api/ownedOrganizations") {
        return json(200, [
          { id: ORGANIZATION, legalName: "Northern Pines Digital Ltd." },
          { id: OTHER_ORGANIZATION, legalName: "Salt Marsh Labs Ltd." },
        ]);
      }
      if (path.startsWith("/api/organizations/")) return json(200, organization());
      if (path === "/api/affiliations") return json(200, members);
      return json(200, []);
    });
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(MANAGE);
    expect((await screen.findByTestId("proposal-organization")).textContent).toBe("Northern Pines Digital Ltd.");
    expect(screen.getByTestId("proposal-status").textContent).toBe("Submitted");
    fireEvent.click(screen.getByTestId("proposal-edit-button"));
    expect(await screen.findByText("It cannot be changed while the proposal is submitted. Withdraw the proposal first to change it.")).toBeTruthy();
    choose("Organization", OTHER_ORGANIZATION);
    fireEvent.click(screen.getByTestId("proposal-save-changes"));
    const errors = await screen.findAllByTestId("field-error");
    expect(errors.map((error) => error.textContent)).toEqual(["Organization: Organization cannot be changed once the proposal has been submitted"]);
    expect(requests.find((request) => request.method === "PUT")?.body).toMatchObject({ tag: "edit", value: { organization: OTHER_ORGANIZATION } });

  });

  it("lists the proposal's history to the vendor (R-2.9)", async () => {
    serve((_method, path) => {
      if (path === `/api/proposals/sprint-with-us/${PROPOSAL}`) return json(200, swuProposal());
      if (path === `/api/opportunities/sprint-with-us/${OPPORTUNITY}`) return json(200, sprint());
      return json(200, []);
    });
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(`${MANAGE}?tab=history`);
    const history = await screen.findByTestId("proposal-history-table");
    expect(history.textContent).toContain("Draft created");
    expect(history.textContent).toContain("Submitted");
  });
});

describe("the vendor's dashboard in all three programs (R-2.24)", () => {
  it("lists a Sprint With Us proposal beside Code With Us ones, leading to its own manage page", async () => {
    serve((_method, path) => {
      if (path === "/api/proposals/sprint-with-us") return json(200, [swuProposal()]);
      if (path === "/api/affiliations") return json(200, []);
      return json(200, []);
    });
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt("/dashboard");
    const rows = within(await screen.findByTestId("dashboard-my-proposals-table")).getAllByTestId("dashboard-proposal-row");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.textContent).toContain("Sprint With Us");
    expect(within(rows[0]!).getByTestId("dashboard-proposal-link").getAttribute("href")).toBe(
      `/opportunities/sprint-with-us/${OPPORTUNITY}/proposals/${PROPOSAL}/edit`,
    );
  });
});

describe("the Proposals tab of a Sprint With Us manage page (R-1.31, R-2.25)", () => {
  const TAB = `/opportunities/sprint-with-us/${OPPORTUNITY}/edit?tab=proposals`;

  it("says the proposals are withheld while the service refuses them, and never lists a draft once it answers", async () => {
    serve((_method, path) => {
      if (path === `/api/opportunities/sprint-with-us/${OPPORTUNITY}`) return json(200, sprint({ createdBy: { id: staff.id, name: staff.name } }));
      if (path === "/api/proposals/sprint-with-us") return json(401, { errors: ["An opportunity's proposals can be seen only by its author and administrators, once it has closed."] });
      return json(200, []);
    });
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    const first = renderAt(TAB);
    expect(await screen.findByTestId("opportunity-proposals-withheld-message")).toBeTruthy();
    expect(screen.getByTestId("opportunity-tab-proposals")).toBeTruthy();
    first.unmount();

    serve((_method, path) => {
      if (path === `/api/opportunities/sprint-with-us/${OPPORTUNITY}`) return json(200, sprint({ createdBy: { id: staff.id, name: staff.name } }));
      if (path === "/api/proposals/sprint-with-us") return json(200, [swuProposal(), swuProposal({ id: "a-draft", status: "DRAFT" })]);
      return json(200, []);
    });
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt(TAB);
    const rows = await screen.findAllByTestId("opportunity-proposal-row");
    expect(rows).toHaveLength(1);
    expect(within(rows[0]!).getByTestId("proposal-proponent-name").textContent).toBe("Northern Pines Digital Ltd.");
    expect(within(rows[0]!).getByTestId("opportunity-proposal-link").getAttribute("href")).toBe(`/opportunities/sprint-with-us/${OPPORTUNITY}/proposals/${PROPOSAL}`);
  });
});

describe("the read-only Sprint With Us and Team With Us proposal pages (R-2.25)", () => {
  const VIEW = `/opportunities/sprint-with-us/${OPPORTUNITY}/proposals/${PROPOSAL}`;
  const closed = { opportunity: { id: OPPORTUNITY, title: "Modernize the licence renewal service", status: "PUBLISHED", proposalDeadline: "2026-01-01", totalMaxBudget: 500_000 } };

  it("shows the opportunity's author a submitted proposal once the opportunity has closed: who proposed, its state, its identifier and its team", async () => {
    serve((_method, path) => {
      if (path === `/api/proposals/sprint-with-us/${PROPOSAL}`) return json(200, swuProposal(closed));
      if (path === `/api/opportunities/sprint-with-us/${OPPORTUNITY}`) return json(200, sprint({ proposalDeadline: "2026-01-01" }));
      return json(200, []);
    });
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    const { container } = renderAt(VIEW);
    expect((await screen.findByTestId("proposal-identifier")).textContent).toBe(PROPOSAL);
    const results = await axe.run(container, { resultTypes: ["violations"], rules: { "color-contrast": { enabled: false } } });
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
    expect(screen.getByTestId("proposal-proponent-name").textContent).toBe("Northern Pines Digital Ltd.");
    expect(screen.getByTestId("proposal-status").textContent).toBe("Submitted");
    expect(screen.getByTestId("proposal-tab-proposal").getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("Dana Placeholder")).toBeTruthy();
    expect(screen.queryByText("Manage this proposal")).toBeNull();
    expect(screen.queryByTestId("proposal-edit-button")).toBeNull();
  });

  it("lists the history on its own tab", async () => {
    serve((_method, path) => {
      if (path === `/api/proposals/sprint-with-us/${PROPOSAL}`) return json(200, swuProposal(closed));
      if (path === `/api/opportunities/sprint-with-us/${OPPORTUNITY}`) return json(200, sprint());
      return json(200, []);
    });
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt(`${VIEW}?tab=history`);
    expect((await screen.findByTestId("proposal-history-table")).textContent).toContain("Submitted");
  });

  it("is the missing page for a proposal the service will not show, for a draft sent to staff, and through another opportunity's address", async () => {
    serve((_method, path) => {
      if (path === `/api/proposals/sprint-with-us/${PROPOSAL}`) return json(404, { errors: ["There is no proposal there."] });
      if (path === `/api/proposals/sprint-with-us/a-draft`) return json(200, swuProposal({ id: "a-draft", status: "DRAFT" }));
      if (path.startsWith("/api/opportunities/sprint-with-us/")) return json(200, sprint());
      return json(200, []);
    });
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    const first = renderAt(VIEW);
    expect(await screen.findByText("Page not found")).toBeTruthy();
    first.unmount();
    const second = renderAt(`/opportunities/sprint-with-us/${OPPORTUNITY}/proposals/a-draft`);
    expect(await screen.findByText("Page not found")).toBeTruthy();
    second.unmount();

    serve((_method, path) => {
      if (path.startsWith("/api/proposals/sprint-with-us/")) return json(200, swuProposal());
      return json(200, sprint());
    });
    renderAt(`/opportunities/sprint-with-us/00000000-0000-4000-8000-000000000999/proposals/${PROPOSAL}`);
    expect(await screen.findByText("Page not found")).toBeTruthy();
  });

  it("shows a Team With Us proposal's team by resource, and offers its vendor the way to manage it", async () => {
    const twuProposal = swuProposal({
      program: "team-with-us",
      prototypePhase: undefined,
      implementationPhase: undefined,
      teamQuestionResponses: undefined,
      opportunity: { id: OPPORTUNITY, title: "Data platform team", status: "PUBLISHED", proposalDeadline: "2030-10-16", maxBudget: 10_000 },
      team: [{ member: { id: "u-owner", name: "Blake Placeholder" }, resource: { id: RESOURCE, serviceArea: "DATA_PROFESSIONAL", targetAllocation: 50 }, hourlyRate: 120 }],
      resourceQuestionResponses: [{ order: 0, response: "Carefully." }],
    });
    serve((_method, path) => {
      if (path === `/api/proposals/team-with-us/${PROPOSAL}`) return json(200, twuProposal);
      if (path === `/api/opportunities/team-with-us/${OPPORTUNITY}`) return json(200, team());
      return json(200, []);
    });
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(`/opportunities/team-with-us/${OPPORTUNITY}/proposals/${PROPOSAL}`);
    expect((await screen.findByTestId("proposal-identifier")).textContent).toBe(PROPOSAL);
    expect(screen.getByText("Team With Us proposal", { selector: "p" })).toBeTruthy();
    expect(screen.getByText("$120")).toBeTruthy();
    expect(screen.getByText("Manage this proposal").getAttribute("href")).toBe(`/opportunities/team-with-us/${OPPORTUNITY}/proposals/${PROPOSAL}/edit`);
  });
});

describe("attachments on Sprint With Us and Team With Us opportunities (R-8.19, R-8.20)", () => {
  it("offers the attachment control on the create page, enabled", async () => {
    serve(() => json(200, []));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/opportunities/team-with-us/create");
    const add = await screen.findByTestId("attachment-add-button");
    expect(add.hasAttribute("disabled")).toBe(false);
    expect(screen.getByTestId("attachment-size-limit")).toBeTruthy();
  });

  it("lists an opportunity's attachments on its public page", async () => {
    serve((_method, path) =>
      path === `/api/opportunities/sprint-with-us/${OPPORTUNITY}` ? json(200, sprint({ attachments: [{ id: "file-1", name: "brief.pdf" }] })) : json(200, []),
    );
    resetSessionForTests({ status: "visitor" }, fakeIdentity());
    renderAt(`/opportunities/sprint-with-us/${OPPORTUNITY}`);
    expect((await screen.findByTestId("attachment-download-link")).textContent).toBe("Download brief.pdf");
  });
});

describe("awarding and the vendor's scoresheet (R-1.26, R-2.32, R-2.34)", () => {
  const VIEW = `/opportunities/sprint-with-us/${OPPORTUNITY}/proposals/${PROPOSAL}`;
  const inProcessing = { id: OPPORTUNITY, title: "Modernize the licence renewal service", status: "PROCESSING", proposalDeadline: "2026-09-02", totalMaxBudget: 500_000 };
  const scoresheet = { questions: 100, challenge: 80, scenario: 70, price: 100, total: 87.5, rank: { rank: 1, of: 2 } };

  function answering(who: Account, start: Record<string, unknown>, onChange: (body: { tag: string; value?: unknown }) => Response) {
    serve((method, path, body) => {
      if (path === `/api/proposals/sprint-with-us/${PROPOSAL}`) {
        return method === "PUT" ? onChange(body as { tag: string }) : json(200, swuProposal(start));
      }
      if (path === `/api/opportunities/sprint-with-us/${OPPORTUNITY}`) return json(200, sprint({ status: "PROCESSING" }));
      return json(200, []);
    });
    resetSessionForTests({ status: "signed-in", account: who }, fakeIdentity());
  }

  it("offers the author Award on a fully evaluated proposal, and awards it after asking", async () => {
    answering(staff, { status: "EVALUATED_TEAM_SCENARIO", opportunity: inProcessing }, () =>
      json(200, swuProposal({ status: "AWARDED", opportunity: { ...inProcessing, status: "AWARDED" } })),
    );
    renderAt(VIEW);
    fireEvent.click(await screen.findByTestId("proposal-award-button"));
    fireEvent.click(await screen.findByTestId("proposal-award-confirm"));
    await waitFor(() => expect(screen.getByTestId("proposal-status").textContent).toBe("Awarded"));
    expect(requests.filter((request) => request.method === "PUT").map((request) => request.body)).toEqual([{ tag: "award" }]);
  });

  it("offers no award before the last stage is evaluated, but still disqualification", async () => {
    answering(staff, { status: "UNDER_REVIEW_CODE_CHALLENGE", opportunity: { ...inProcessing, status: "EVAL_CC" } }, () => json(500, {}));
    renderAt(VIEW);
    const actions = await screen.findByTestId("proposal-actions");
    expect(within(actions).queryByTestId("proposal-award-button")).toBeNull();
    expect(within(actions).getByTestId("proposal-disqualify-button")).toBeTruthy();
  });

  it("shows the vendor a Scoresheet tab once decided, with the anonymous name, the total and the rank", async () => {
    answering(vendor, { status: "NOT_AWARDED", opportunity: { ...inProcessing, status: "AWARDED" }, anonymousProponentName: "Proponent 2", scoresheet }, () =>
      json(500, {}),
    );
    renderAt(`${VIEW}/edit?tab=scoresheet`);
    expect((await screen.findByTestId("proposal-total-score")).textContent).toBe("87.5%");
    expect(screen.getByTestId("proposal-rank").textContent).toBe("1 of 2");
    expect(screen.getByTestId("proposal-anonymous-name").textContent).toBe("Proponent 2");
  });

  it("shows staff the proposal's total score and rank on the read-only page, awarded or passed over (R-2.32)", async () => {
    for (const status of ["AWARDED", "NOT_AWARDED"]) {
      answering(staff, { status, opportunity: { ...inProcessing, status: "AWARDED" }, scoresheet }, () => json(500, {}));
      const view = renderAt(VIEW);
      const total = await screen.findByTestId("proposal-total-score");
      expect(total.textContent).toBe("87.5%");
      expect(total.previousElementSibling?.textContent).toBe("Total score");
      expect(screen.getByTestId("proposal-scenario-score").textContent).toBe("70%");
      expect(screen.getByTestId("proposal-rank").textContent).toBe("1 of 2");
      view.unmount();
    }
  });

  it("says a total not yet calculated, and shows the vendor no scores on the read-only page", async () => {
    answering(staff, { status: "UNDER_REVIEW_CODE_CHALLENGE", opportunity: { ...inProcessing, status: "EVAL_CC" }, scoresheet: { ...scoresheet, challenge: null, scenario: null, price: null, total: null, rank: null } }, () => json(500, {}));
    const view = renderAt(VIEW);
    expect((await screen.findByTestId("proposal-total-score")).textContent).toBe("Not yet calculated");
    expect(screen.queryByTestId("proposal-rank")).toBeNull();
    view.unmount();

    answering(vendor, { status: "EVALUATED_TEAM_SCENARIO", opportunity: inProcessing, scoresheet }, () => json(500, {}));
    renderAt(VIEW);
    await screen.findByTestId("proposal-identifier");
    expect(screen.queryByTestId("proposal-total-score")).toBeNull();
  });

  it("shows the vendor their total and rank on the read-only page once decided (R-2.32)", async () => {
    answering(vendor, { status: "AWARDED", opportunity: { ...inProcessing, status: "AWARDED" }, scoresheet }, () => json(500, {}));
    renderAt(VIEW);
    expect((await screen.findByTestId("proposal-total-score")).textContent).toBe("87.5%");
    expect(screen.getByTestId("proposal-rank").textContent).toBe("1 of 2");
  });

  it("shows staff the organization's contact person on the proposal tab when the service gives it (R-1.27)", async () => {
    const organization = {
      id: "00000000-0000-4000-8000-000000000301",
      legalName: "Northern Pines Digital Ltd.",
      contact: { name: "Blake Placeholder", email: "org.owner@example.test", phone: "250-555-0101" },
    };
    answering(staff, { status: "AWARDED", opportunity: { ...inProcessing, status: "AWARDED" }, scoresheet, organization }, () => json(500, {}));
    renderAt(`${VIEW}?tab=proposal`);
    await screen.findByTestId("proposal-identifier");
    expect(await screen.findByText("org.owner@example.test")).toBeTruthy();
    expect(screen.getByText("250-555-0101")).toBeTruthy();
  });

  it("has no Scoresheet tab before a decision", async () => {
    answering(vendor, { status: "EVALUATED_TEAM_SCENARIO", opportunity: inProcessing }, () => json(500, {}));
    renderAt(`${VIEW}/edit`);
    await screen.findByTestId("proposal-tab-proposal");
    expect(screen.queryByTestId("proposal-tab-scoresheet")).toBeNull();
    expect(screen.queryByTestId("proposal-total-score")).toBeNull();
  });
});
