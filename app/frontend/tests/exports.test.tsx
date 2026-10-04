import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Account } from "../src/api/accounts";
import type { IdentityClient } from "../src/auth/identity-client";
import { resetSessionForTests } from "../src/auth/session";
import { routeTree } from "../src/router";

/**
 * Taking proposals away and reading an opportunity whole (proposal-*-export-one,
 * proposal-*-export-all, opportunity-*-complete): who is shown each, and under what name each
 * proposal goes. The service is stood in for; what is checked is what the screens show and what
 * they ask of it.
 */

function account(overrides: Partial<Account>): Account {
  return {
    id: "00000000-0000-4000-8000-000000000201",
    type: "VENDOR",
    status: "ACTIVE",
    name: "Avery Placeholder",
    email: "vendor@example.test",
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
const staff = account({ id: "00000000-0000-4000-8000-000000000102", type: "GOV", name: "Casey Placeholder" });
const administrator = account({ id: "00000000-0000-4000-8000-000000000101", type: "ADMIN", name: "Riley Placeholder" });

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

const SWU = "00000000-0000-4000-a020-000000000001";
const CWU = "00000000-0000-4000-a020-000000000002";
const SWU_ONE = "00000000-0000-4000-a020-000000000101";
const SWU_TWO = "00000000-0000-4000-a020-000000000102";
const CWU_ONE = "00000000-0000-4000-a020-000000000201";
const CWU_TWO = "00000000-0000-4000-a020-000000000202";

const sprint = (overrides: Record<string, unknown> = {}) => ({
  id: SWU,
  program: "sprint-with-us",
  createdAt: "2026-09-01T17:00:00.000Z",
  updatedAt: "2026-09-01T17:00:00.000Z",
  createdBy: { id: staff.id, name: staff.name },
  status: "EVAL_QUESTIONS_INDIVIDUAL",
  publishedAt: "2026-09-10T17:00:00.000Z",
  title: "Modernize the licence renewal service",
  teaser: "",
  location: "Victoria",
  remoteOk: false,
  remoteDesc: "",
  description: "Licence holders renew on paper today.",
  proposalDeadline: "2026-09-20",
  assignmentDate: "2026-09-27",
  totalMaxBudget: 1_200_000,
  mandatorySkills: ["React"],
  inceptionPhase: null,
  prototypePhase: { phase: "PROTOTYPE", startDate: "2026-11-02", completionDate: "2027-01-29", maxBudget: 300_000, requiredCapabilities: [] },
  implementationPhase: { phase: "IMPLEMENTATION", startDate: "2027-02-01", completionDate: "2027-09-30", maxBudget: 900_000, requiredCapabilities: [] },
  teamQuestions: [{ question: "How would your team approach user research?", guideline: "", score: 5, minimumScore: null, wordLimit: 300, order: 0 }],
  questionsWeight: 30,
  codeChallengeWeight: 30,
  scenarioWeight: 20,
  priceWeight: 20,
  subscribed: false,
  attachments: [],
  addenda: [{ id: "add-1", createdAt: "2026-09-12T17:00:00.000Z", createdBy: { id: staff.id, name: staff.name }, description: "The kick-off meeting will be held by video." }],
  history: [
    { createdAt: "2026-09-21T07:00:00.000Z", createdBy: null, status: "EVAL_QUESTIONS_INDIVIDUAL", event: null, note: "This opportunity has closed." },
    { createdAt: "2026-09-10T17:00:00.000Z", createdBy: { id: administrator.id, name: administrator.name }, status: "PUBLISHED", event: null, note: null },
  ],
  ...overrides,
});

const swuProposal = (overrides: Record<string, unknown> = {}) => ({
  id: SWU_ONE,
  program: "sprint-with-us",
  createdAt: "2026-09-15T17:00:00.000Z",
  updatedAt: "2026-09-15T17:00:00.000Z",
  createdBy: { id: vendor.id, name: vendor.name },
  status: "UNDER_REVIEW_QUESTIONS",
  submittedAt: "2026-09-15T21:12:00.000Z",
  opportunity: { id: SWU, title: "Modernize the licence renewal service", status: "EVAL_QUESTIONS_INDIVIDUAL", proposalDeadline: "2026-09-20", totalMaxBudget: 1_200_000 },
  organization: { id: "00000000-0000-4000-8000-000000000301", legalName: "Example Digital Ltd." },
  totalProposedCost: 1_150_000,
  inceptionPhase: null,
  prototypePhase: { members: [{ member: { id: "m-1", name: "Dana Placeholder" }, scrumMaster: true }], proposedCost: 300_000 },
  implementationPhase: { members: [{ member: { id: "m-2", name: "Jordan Placeholder" }, scrumMaster: true }], proposedCost: 850_000 },
  teamQuestionResponses: [{ order: 0, response: "We would start with the renewal staff." }],
  references: [{ name: "Robin Reference", company: "Placeholder Works", phone: "", email: "robin@example.test", order: 0 }],
  attachments: [{ id: "f-1", name: "Delivery approach.pdf" }],
  anonymousProponentName: "Proponent 1",
  history: [],
  ...overrides,
});

const cwuOpportunity = (overrides: Record<string, unknown> = {}) => ({
  id: CWU,
  program: "code-with-us",
  createdAt: "2026-09-01T17:00:00.000Z",
  updatedAt: "2026-09-01T17:00:00.000Z",
  createdBy: { id: staff.id, name: staff.name },
  status: "AWARDED",
  publishedAt: "2026-09-10T17:00:00.000Z",
  title: "Build an accessible permit tracker",
  teaser: "",
  remoteOk: true,
  remoteDesc: "Anywhere.",
  location: "Victoria",
  reward: 45000,
  skills: ["Accessibility"],
  description: "A status page that works with a screen reader.",
  proposalDeadline: "2026-09-20",
  assignmentDate: "2026-09-27",
  startDate: "2026-10-04",
  completionDate: null,
  attachments: [],
  addenda: [],
  subscribed: false,
  history: [{ createdAt: "2026-10-30T17:00:00.000Z", createdBy: { id: administrator.id, name: administrator.name }, status: "AWARDED", event: null, note: null }],
  ...overrides,
});

const cwuProposal = (overrides: Record<string, unknown> = {}) => ({
  id: CWU_ONE,
  program: "code-with-us",
  createdAt: "2026-09-12T17:30:00.000Z",
  updatedAt: "2026-09-15T21:12:00.000Z",
  createdBy: { id: vendor.id, name: vendor.name },
  status: "AWARDED",
  submittedAt: "2026-09-15T21:12:00.000Z",
  opportunity: { id: CWU, title: "Build an accessible permit tracker", status: "AWARDED", proposalDeadline: "2026-09-20", reward: 45000 },
  proposalText: "I will add a status page.",
  additionalComments: "",
  proponent: {
    tag: "individual",
    value: { legalName: "Alex Placeholder", email: "alex@example.test", phone: "", street1: "100 Example Street", street2: "", city: "Victoria", region: "BC", mailCode: "V8W 0A0", country: "Canada" },
  },
  attachments: [],
  anonymousProponentName: "",
  score: 91.5,
  rank: null,
  history: [],
  ...overrides,
});

const requests: { method: string; address: string }[] = [];

function serve(handler: (method: string, path: string, search: string) => Response) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: Request) => {
      const url = new URL(input.url);
      requests.push({ method: input.method, address: `${url.pathname}${url.search}` });
      return handler(input.method, url.pathname, url.search);
    }),
  );
}

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function renderAt(address: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [address] }) });
  const view = render(<RouterProvider router={router as never} />);
  return { ...view, router };
}

function signedIn(who: Account) {
  resetSessionForTests({ status: "signed-in", account: who }, fakeIdentity());
}

beforeEach(() => {
  requests.length = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetSessionForTests();
});

describe("the printable copy of one Sprint With Us proposal (R-2.37)", () => {
  const COPY = `/opportunities/sprint-with-us/${SWU}/proposals/${SWU_ONE}/export`;

  function aProposal(start: Record<string, unknown>) {
    serve((_method, path) => {
      if (path === `/api/proposals/sprint-with-us/${SWU_ONE}`) return json(200, swuProposal(start));
      if (path === `/api/opportunities/sprint-with-us/${SWU}`) return json(200, sprint());
      return json(404, {});
    });
  }

  it("names the proponent only as its anonymous name to the opportunity's author while it is under review on its questions", async () => {
    aProposal({});
    signedIn(staff);
    renderAt(COPY);
    const document = await screen.findByTestId("proposal-export-document");
    expect(within(document).getByTestId("proposal-proponent-name").textContent).toBe("Proponent 1");
    expect(document.textContent).not.toContain("Example Digital Ltd.");
    expect(document.textContent).toContain("withheld from evaluators until the proposal reaches the code challenge");
    expect(document.textContent).toContain("We would start with the renewal staff.");
    expect(document.textContent).toContain("Delivery approach.pdf");
  });

  it("names the organization to the vendor who wrote it, and sends them back to manage it", async () => {
    aProposal({});
    signedIn(vendor);
    renderAt(COPY);
    expect((await screen.findByTestId("proposal-proponent-name")).textContent).toBe("Example Digital Ltd.");
    expect(screen.getByRole("link", { name: "Back to the proposal" }).getAttribute("href")).toBe(`/opportunities/sprint-with-us/${SWU}/proposals/${SWU_ONE}/edit`);
  });

  it("names the organization to staff once the proposal has reached the code challenge", async () => {
    aProposal({ status: "UNDER_REVIEW_CODE_CHALLENGE" });
    signedIn(staff);
    renderAt(COPY);
    expect((await screen.findByTestId("proposal-proponent-name")).textContent).toBe("Example Digital Ltd.");
  });

  it("is the missing page to anybody the service will not show the proposal", async () => {
    serve(() => json(404, {}));
    signedIn(account({ id: "00000000-0000-4000-8000-000000000299" }));
    renderAt(COPY);
    await screen.findByTestId("not-found-page");
  });

  it("is the missing page to a visitor, and asks nothing of the service", async () => {
    serve(() => json(404, {}));
    resetSessionForTests({ status: "visitor" }, fakeIdentity());
    renderAt(COPY);
    await screen.findByTestId("not-found-page");
    expect(requests.filter((request) => request.address.startsWith("/api/proposals"))).toEqual([]);
  });

  it("has nothing to answer for", async () => {
    aProposal({});
    signedIn(staff);
    const { container } = renderAt(COPY);
    await screen.findByTestId("proposal-export-document");
    const results = await axe.run(container, { resultTypes: ["violations"], rules: { "color-contrast": { enabled: false } } });
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  });
});

describe("the printable copy of one Code With Us proposal (R-2.37)", () => {
  it("names the proponent to staff and gives the proposal whole", async () => {
    serve((_method, path) => (path === `/api/proposals/code-with-us/${CWU_ONE}` ? json(200, cwuProposal()) : json(404, {})));
    signedIn(staff);
    renderAt(`/opportunities/code-with-us/${CWU}/proposals/${CWU_ONE}/export`);
    const document = await screen.findByTestId("proposal-export-document");
    expect(within(document).getByTestId("proposal-proponent-name").textContent).toBe("Alex Placeholder");
    expect(document.textContent).toContain("I will add a status page.");
    expect(document.textContent).toContain("alex@example.test");
  });
});

describe("every Sprint With Us proposal in one document (R-2.38)", () => {
  const ALL = `/opportunities/sprint-with-us/${SWU}/proposals/export`;
  const proposals = [
    swuProposal({ id: SWU_TWO, anonymousProponentName: "Proponent 2", organization: { id: "o-2", legalName: "Sample Software Co-op" } }),
    swuProposal({ id: "draft", status: "DRAFT", anonymousProponentName: "", organization: { id: "o-3", legalName: "Draft Holder Inc." } }),
    swuProposal({}),
  ];

  function closed() {
    serve((_method, path) => {
      if (path === "/api/proposals/sprint-with-us") return json(200, proposals);
      if (path === `/api/opportunities/sprint-with-us/${SWU}`) return json(200, sprint());
      return json(404, {});
    });
  }

  it("is refused to a vendor, who is shown the missing page and asks nothing of the service", async () => {
    closed();
    signedIn(vendor);
    renderAt(ALL);
    await screen.findByTestId("not-found-page");
    expect(requests.filter((request) => request.address.startsWith("/api/proposals"))).toEqual([]);
  });

  it("gives the opportunity's author every submitted proposal, named, and never a draft", async () => {
    closed();
    signedIn(staff);
    renderAt(ALL);
    const document = await screen.findByTestId("proposal-export-document");
    expect(within(document).getAllByTestId("proposal-export-item")).toHaveLength(2);
    expect(within(document).getAllByTestId("proposal-proponent-name").map((name) => name.textContent)).toEqual(["Example Digital Ltd.", "Sample Software Co-op"]);
    expect(document.textContent).not.toContain("Draft Holder Inc.");
    expect(requests.some((request) => request.address === `/api/proposals/sprint-with-us?opportunity=${SWU}`)).toBe(true);
  });

  it("names the proponents anonymously once asked, and keeps that choice in the address", async () => {
    closed();
    signedIn(staff);
    const { router } = renderAt(ALL);
    await screen.findByTestId("proposal-export-document");
    fireEvent.click(within(screen.getByTestId("proposal-export-anonymous-toggle")).getByRole("checkbox"));
    await waitFor(() =>
      expect(screen.getAllByTestId("proposal-proponent-name").map((name) => name.textContent)).toEqual(["Proponent 1", "Proponent 2"]),
    );
    expect(screen.getByTestId("proposal-export-document").textContent).not.toContain("Example Digital Ltd.");
    expect(router.state.location.search).toEqual({ anonymous: "true" });
  });

  it("opens anonymous when the address asks for it", async () => {
    closed();
    signedIn(administrator);
    renderAt(`${ALL}?anonymous=true`);
    await screen.findByTestId("proposal-export-document");
    expect(screen.getAllByTestId("proposal-proponent-name").map((name) => name.textContent)).toEqual(["Proponent 1", "Proponent 2"]);
    expect((within(screen.getByTestId("proposal-export-anonymous-toggle")).getByRole("checkbox") as HTMLInputElement).checked).toBe(true);
  });

  it("is the missing page to staff the service does not answer", async () => {
    serve((_method, path) => (path === "/api/proposals/sprint-with-us" ? json(401, ["Proposals are not yet visible."]) : json(200, sprint())));
    signedIn(staff);
    renderAt(ALL);
    await screen.findByTestId("not-found-page");
  });
});

describe("every Code With Us proposal in one document, anonymously (R-2.38)", () => {
  it("names each proponent by its place and withholds its contact details", async () => {
    serve((_method, path) => {
      if (path === "/api/proposals/code-with-us") {
        return json(200, [cwuProposal(), cwuProposal({ id: CWU_TWO, proponent: { tag: "organization", value: { id: "o-1", legalName: "Example Digital Co-operative" } } })]);
      }
      if (path === `/api/opportunities/code-with-us/${CWU}`) return json(200, cwuOpportunity());
      return json(404, {});
    });
    signedIn(staff);
    renderAt(`/opportunities/code-with-us/${CWU}/proposals/export?anonymous=true`);
    const document = await screen.findByTestId("proposal-export-document");
    expect(within(document).getAllByTestId("proposal-proponent-name").map((name) => name.textContent)).toEqual(["Proponent 1", "Proponent 2"]);
    expect(document.textContent).not.toContain("alex@example.test");
    expect(document.textContent).not.toContain("Example Digital Co-operative");
    expect(document.textContent).toContain("I will add a status page.");
  });
});

describe("the full report of an opportunity (R-1.40)", () => {
  function evaluated() {
    serve((_method, path) => {
      if (path === `/api/opportunities/sprint-with-us/${SWU}`) return json(200, sprint());
      if (path === "/api/proposals/sprint-with-us") return json(200, [swuProposal({ id: SWU_TWO, anonymousProponentName: "Proponent 2", organization: { id: "o-2", legalName: "Sample Software Co-op" } }), swuProposal({})]);
      if (path === `/api/opportunities/code-with-us/${CWU}`) return json(200, cwuOpportunity());
      if (path === "/api/proposals/code-with-us") return json(200, [cwuProposal()]);
      return json(404, {});
    });
  }

  it("is refused to a member of staff who is not an administrator, the author included, without asking the service", async () => {
    evaluated();
    signedIn(staff);
    renderAt(`/opportunities/sprint-with-us/${SWU}/complete`);
    await screen.findByTestId("not-found-page");
    expect(requests.filter((request) => request.address.startsWith("/api/"))).toEqual([]);
  });

  it("shows an administrator the opportunity, its addenda, its history and every proposal in one document", async () => {
    evaluated();
    signedIn(administrator);
    renderAt(`/opportunities/sprint-with-us/${SWU}/complete`);
    const report = await screen.findByTestId("opportunity-full-report");
    const text = report.textContent ?? "";
    expect(text).toContain("Licence holders renew on paper today.");
    expect(text).toContain("The kick-off meeting will be held by video.");
    expect(text).toContain("Published, by Riley Placeholder");
    expect(text).toContain("This opportunity has closed.");
    expect(within(report).getAllByTestId("report-proposal").map((article) => article.querySelector("h3")?.textContent)).toEqual([
      "Example Digital Ltd.",
      "Sample Software Co-op",
    ]);
    expect(text).toContain("We would start with the renewal staff.");
    expect(text).toContain("team questions 30%");
  });

  it("does the same for Code With Us", async () => {
    evaluated();
    signedIn(administrator);
    const { container } = renderAt(`/opportunities/code-with-us/${CWU}/complete`);
    const report = await screen.findByTestId("opportunity-full-report");
    expect(report.textContent).toContain("Alex Placeholder");
    expect(report.textContent).toContain("Score: 91.5%");
    expect(report.textContent).toContain("Reward");
    const results = await axe.run(container, { resultTypes: ["violations"], rules: { "color-contrast": { enabled: false } } });
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  });
});
