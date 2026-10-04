import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ALREADY_HAVE_PROPOSAL, NOT_ACCEPTING_PROPOSALS } from "@rules/proposals";
import type { Account } from "../src/api/accounts";
import type { IdentityClient } from "../src/auth/identity-client";
import { resetSessionForTests } from "../src/auth/session";
import { routeTree } from "../src/router";

/**
 * Proposing on a Code With Us opportunity, as the screens do it (proposal-cwu-create,
 * proposal-cwu-edit, proposal-vendor-dashboard, and Start a proposal on opportunity-cwu-view). The
 * service is stood in for; what is checked is what the screens show and what they ask of it.
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
const staff = account({ id: "00000000-0000-4000-8000-000000000102", type: "GOV", name: "Casey Placeholder" });
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

const OPPORTUNITY = "00000000-0000-4000-8000-000000000601";
const PROPOSAL = "00000000-0000-4000-8000-000000000a01";
const ORGANIZATION = "00000000-0000-4000-8000-000000000302";

const opportunity = (overrides: Record<string, unknown> = {}) => ({
  id: OPPORTUNITY,
  program: "code-with-us",
  createdAt: "2026-09-30T17:00:00.000Z",
  updatedAt: "2026-09-30T17:00:00.000Z",
  status: "PUBLISHED",
  publishedAt: "2026-09-30T17:00:00.000Z",
  title: "Build an accessible permit tracker",
  teaser: "",
  remoteOk: true,
  remoteDesc: "Anywhere.",
  location: "Victoria",
  reward: 45000,
  skills: ["Accessibility"],
  description: "What the work is.",
  proposalDeadline: "2030-06-01",
  assignmentDate: "2030-06-15",
  startDate: "2030-07-01",
  completionDate: null,
  attachments: [],
  addenda: [],
  subscribed: false,
  ...overrides,
});

const individual = {
  legalName: "Alex Placeholder",
  email: "alex@example.test",
  phone: "",
  street1: "100 Example Street",
  street2: "",
  city: "Victoria",
  region: "BC",
  mailCode: "V8W 0A0",
  country: "Canada",
};

const blank = { legalName: "", email: "", street1: "", city: "", region: "", mailCode: "", country: "" };

const proposal = (overrides: Record<string, unknown> = {}) => ({
  id: PROPOSAL,
  program: "code-with-us",
  createdAt: "2026-09-12T17:30:00.000Z",
  updatedAt: "2026-09-15T21:12:00.000Z",
  createdBy: { id: vendor.id, name: vendor.name },
  updatedBy: { id: vendor.id, name: vendor.name },
  status: "SUBMITTED",
  submittedAt: "2026-09-15T21:12:00.000Z",
  opportunity: { id: OPPORTUNITY, title: "Build an accessible permit tracker", status: "PUBLISHED", proposalDeadline: "2030-06-01", reward: 45000 },
  proposalText: "We will build it.",
  additionalComments: "",
  proponent: { tag: "individual", value: individual },
  attachments: [],
  anonymousProponentName: "",
  history: [
    { createdAt: "2026-09-15T21:12:00.000Z", createdBy: { id: vendor.id, name: vendor.name }, status: "SUBMITTED", event: null, note: null },
    { createdAt: "2026-09-12T17:30:00.000Z", createdBy: { id: vendor.id, name: vendor.name }, status: "DRAFT", event: null, note: null },
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

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function renderAt(address: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [address] }) });
  const view = render(<RouterProvider router={router as never} />);
  return { ...view, router };
}

const field = (testId: string) =>
  screen.getByTestId(testId).querySelector("input, textarea") as HTMLInputElement | HTMLTextAreaElement;

function type(testId: string, value: string) {
  fireEvent.change(field(testId), { target: { value } });
}

const CREATE = `/opportunities/code-with-us/${OPPORTUNITY}/proposals/create`;
const MANAGE = `/opportunities/code-with-us/${OPPORTUNITY}/proposals/${PROPOSAL}/edit`;

/** The service as the create page meets it: the opportunity, no proposal yet, one organization. */
function aNewProposal(onWrite: (method: string, path: string, body: unknown) => Response = () => json(201, proposal({ status: "DRAFT" }))) {
  serve((method, path, body) => {
    if (method !== "GET") return onWrite(method, path, body);
    if (path === `/api/opportunities/code-with-us/${OPPORTUNITY}`) return json(200, opportunity());
    if (path === "/api/proposals/code-with-us") return json(200, []);
    if (path === "/api/ownedOrganizations") return json(200, [{ id: ORGANIZATION, legalName: "Cedar Hollow Systems Inc." }]);
    if (path === `/api/proposals/code-with-us/${PROPOSAL}`) return json(200, proposal({ status: "DRAFT" }));
    return json(200, []);
  });
}

function chooseIndividual() {
  fireEvent.click(within(screen.getByTestId("proposal-proponent-individual")).getByRole("radio"));
}

function fillIndividual() {
  chooseIndividual();
  type("proposal-legal-name-field", individual.legalName);
  type("proposal-email-field", individual.email);
  type("proposal-street-field", individual.street1);
  type("proposal-city-field", individual.city);
  type("proposal-region-field", individual.region);
  type("proposal-postal-field", individual.mailCode);
  type("proposal-country-field", individual.country);
  type("proposal-text-field", "We will build it.");
}

beforeEach(() => {
  requests.length = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetSessionForTests();
});

describe("starting a proposal (R-2.1, R-2.2)", () => {
  for (const [who, session] of [
    ["public sector staff", { status: "signed-in", account: staff }],
    ["an administrator", { status: "signed-in", account: administrator }],
    ["a visitor", { status: "visitor" }],
  ] as const) {
    it(`is the missing page for ${who}`, async () => {
      aNewProposal();
      resetSessionForTests(session as never, fakeIdentity());
      renderAt(CREATE);
      await screen.findByTestId("not-found-page");
      expect(requests.filter((request) => request.address.startsWith("/api/proposals"))).toEqual([]);
    });
  }

  it("takes a vendor who already holds a proposal on the opportunity to it", async () => {
    serve((_method, path) => {
      if (path === "/api/proposals/code-with-us") return json(200, [proposal()]);
      if (path === `/api/proposals/code-with-us/${PROPOSAL}`) return json(200, proposal());
      if (path === `/api/opportunities/code-with-us/${OPPORTUNITY}`) return json(200, opportunity());
      return json(200, []);
    });
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const { router } = renderAt(CREATE);
    await waitFor(() => expect(router.state.location.pathname).toBe(MANAGE));
    expect((await screen.findByTestId("proposal-identifier")).textContent).toBe(PROPOSAL);
  });

  it("is offered on the opportunity's page to a vendor, and leads to the proposal they hold once they have one", async () => {
    let held: unknown[] = [];
    serve((_method, path) => {
      if (path === `/api/opportunities/code-with-us/${OPPORTUNITY}`) return json(200, opportunity());
      if (path === "/api/proposals/code-with-us") return json(200, held);
      return json(200, {});
    });
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const first = renderAt(`/opportunities/code-with-us/${OPPORTUNITY}`);
    expect((await screen.findByTestId("opportunity-start-proposal")).getAttribute("href")).toBe(CREATE);
    first.unmount();

    held = [proposal()];
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(`/opportunities/code-with-us/${OPPORTUNITY}`);
    await waitFor(() => expect(screen.getByTestId("opportunity-start-proposal").getAttribute("href")).toBe(MANAGE));
  });

  it("is not offered to staff, nor once the deadline has passed", async () => {
    serve((_method, path) =>
      path === `/api/opportunities/code-with-us/${OPPORTUNITY}` ? json(200, opportunity({ proposalDeadline: "2026-01-01" })) : json(200, []),
    );
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const view = renderAt(`/opportunities/code-with-us/${OPPORTUNITY}`);
    await screen.findByTestId("opportunity-identifier");
    expect(screen.queryByTestId("opportunity-start-proposal")).toBeNull();
    view.unmount();

    serve((_method, path) => (path === `/api/opportunities/code-with-us/${OPPORTUNITY}` ? json(200, opportunity()) : json(200, [])));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt(`/opportunities/code-with-us/${OPPORTUNITY}`);
    await screen.findByTestId("opportunity-identifier");
    expect(screen.queryByTestId("opportunity-start-proposal")).toBeNull();
  });
});

describe("the create page (R-2.3, R-2.12, R-2.13, R-2.14)", () => {
  it("shows the opportunity, and saves a blank draft as it is, landing on its manage page", async () => {
    aNewProposal();
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const { router } = renderAt(CREATE);
    const summary = await screen.findByTestId("proposal-opportunity-summary");
    expect(within(summary).getByText("Build an accessible permit tracker")).toBeTruthy();
    expect(within(summary).getByText("$45,000")).toBeTruthy();
    expect(screen.getByTestId("attachment-size-limit")).toBeTruthy();

    fireEvent.click(screen.getByTestId("proposal-save-draft"));
    await waitFor(() => expect(router.state.location.pathname).toBe(MANAGE));
    const created = requests.find((request) => request.method === "POST");
    expect(created?.address).toBe("/api/proposals/code-with-us");
    expect(created?.body).toMatchObject({ opportunity: OPPORTUNITY, status: "DRAFT", proposalText: "", proponent: { tag: "individual" } });
  });

  it("names every missing field before submitting, and sends nothing", async () => {
    aNewProposal();
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(CREATE);
    await screen.findByTestId("proposal-submit");
    chooseIndividual();
    type("proposal-email-field", "test.vendor@");
    fireEvent.click(screen.getByTestId("proposal-submit"));

    const errors = await screen.findAllByTestId("field-error");
    expect(errors.map((error) => error.textContent)).toEqual([
      "Legal name: enter your legal name",
      "Email address: enter an email address in the form name@example.com",
      "Street address: enter a street address",
      "City: enter a city",
      "Province or state: enter a province or state",
      "Postal code: enter a postal code",
      "Country: enter a country",
      "Proposal: enter your proposal, up to 10,000 characters",
    ]);
    expect(screen.queryByTestId("proposal-terms-dialog")).toBeNull();
    expect(requests.filter((request) => request.method !== "GET")).toEqual([]);
  });

  it("chooses no proponent for the vendor, and refuses to submit one that carries none, sending nothing", async () => {
    aNewProposal();
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(CREATE);
    await screen.findByTestId("proposal-submit");
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios.map((radio) => radio.checked)).toEqual([false, false]);
    expect(screen.queryByTestId("proposal-legal-name-field")).toBeNull();
    expect(screen.queryByTestId("proposal-organization-field")).toBeNull();

    type("proposal-text-field", "We will build it.");
    fireEvent.click(screen.getByTestId("proposal-submit"));
    const errors = await screen.findAllByTestId("field-error");
    expect(errors.map((error) => error.textContent)).toEqual([
      "Proponent: choose whether an individual or an organization is submitting this proposal",
    ]);
    expect(screen.queryByTestId("proposal-terms-dialog")).toBeNull();
    expect(requests.filter((request) => request.method !== "GET")).toEqual([]);
  });

  it("refuses to submit a draft kept with no proponent from its manage page", async () => {
    serve((_method, path) => {
      if (path === `/api/proposals/code-with-us/${PROPOSAL}`) {
        return json(200, proposal({ status: "DRAFT", proponent: { tag: "individual", value: { ...individual, ...blank } } }));
      }
      if (path === `/api/opportunities/code-with-us/${OPPORTUNITY}`) return json(200, opportunity());
      return json(200, []);
    });
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(MANAGE);
    fireEvent.click(await screen.findByTestId("proposal-submit"));
    const errors = await screen.findAllByTestId("field-error");
    expect(errors.map((error) => error.textContent)).toEqual([
      "Proponent: choose whether an individual or an organization is submitting this proposal",
    ]);
    expect(screen.queryByTestId("proposal-terms-dialog")).toBeNull();
    expect(requests.filter((request) => request.method !== "GET")).toEqual([]);
  });

  it("asks for both terms before submitting, records the acceptance, then submits", async () => {
    aNewProposal((method, path) => {
      if (method === "PUT" && path === `/api/users/${vendor.id}`) return json(200, vendor);
      return json(201, proposal());
    });
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const { router } = renderAt(CREATE);
    await screen.findByTestId("proposal-submit");
    fillIndividual();
    fireEvent.click(screen.getByTestId("proposal-submit"));

    await screen.findByTestId("proposal-terms-dialog");
    const confirm = () => screen.getByTestId("proposal-submit-confirm");
    expect(confirm().hasAttribute("disabled") || confirm().getAttribute("aria-disabled") === "true").toBe(true);
    fireEvent.click(within(screen.getByTestId("proposal-accept-program-terms")).getByRole("checkbox"));
    expect(confirm().hasAttribute("disabled") || confirm().getAttribute("aria-disabled") === "true").toBe(true);
    fireEvent.click(within(screen.getByTestId("proposal-accept-app-terms")).getByRole("checkbox"));
    await waitFor(() => expect(confirm().hasAttribute("disabled")).toBe(false));
    fireEvent.click(confirm());

    await waitFor(() => expect(router.state.location.pathname).toBe(MANAGE));
    const writes = requests.filter((request) => request.method !== "GET");
    expect(writes.map((request) => [request.method, request.address])).toEqual([
      ["PUT", `/api/users/${vendor.id}`],
      ["POST", "/api/proposals/code-with-us"],
    ]);
    expect(writes[0]!.body).toEqual({ tag: "acceptTerms" });
    expect(writes[1]!.body).toMatchObject({ status: "SUBMITTED", proponent: { tag: "individual", value: { legalName: individual.legalName } } });
  });

  it("offers the vendor's own organizations in place of an individual's details", async () => {
    aNewProposal();
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(CREATE);
    await screen.findByTestId("proposal-proponent-organization");
    fireEvent.click(within(screen.getByTestId("proposal-proponent-organization")).getByRole("radio"));
    expect(await screen.findByTestId("proposal-organization-field")).toBeTruthy();
    expect(screen.queryByTestId("proposal-legal-name-field")).toBeNull();
  });

  it("says when the service refuses a second proposal, with the way to the first", async () => {
    aNewProposal(() => json(400, { errors: [ALREADY_HAVE_PROPOSAL], existingProposalId: PROPOSAL }));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(CREATE);
    fireEvent.click(await screen.findByTestId("proposal-save-draft"));
    const refused = await screen.findByTestId("proposal-refused-message");
    expect(refused.textContent).toContain(ALREADY_HAVE_PROPOSAL);
    expect(within(refused).getByText("Open your proposal").getAttribute("href")).toBe(MANAGE);
  });

  it("puts the service's refusal of a field against that field", async () => {
    aNewProposal(() => json(400, { errors: ["organization: Please select a different organization."], existingOrganizationProposal: { proposalId: "x" } }));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(CREATE);
    fireEvent.click(await screen.findByTestId("proposal-save-draft"));
    const errors = await screen.findAllByTestId("field-error");
    expect(errors.map((error) => error.textContent)).toEqual(["Organization: Please select a different organization."]);
  });

  it.each([
    ["closed for evaluation", { status: "EVALUATION", proposalDeadline: "2026-01-01" }],
    ["still published past its deadline", { status: "PUBLISHED", proposalDeadline: "2026-01-01" }],
  ])("stays open on an opportunity %s, and shows the service's refusal of a submission (R-2.15)", async (_, closed) => {
    serve((method, path) => {
      if (method === "PUT" && path === `/api/users/${vendor.id}`) return json(200, vendor);
      if (method === "POST") return json(400, { errors: [NOT_ACCEPTING_PROPOSALS] });
      if (path === `/api/opportunities/code-with-us/${OPPORTUNITY}`) return json(200, opportunity(closed));
      if (path === "/api/ownedOrganizations") return json(200, []);
      return json(200, []);
    });
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(CREATE);
    fireEvent.click(await screen.findByTestId("proposal-submit"));
    // Nothing is worth completing once it has closed: the terms are asked for straight away.
    await screen.findByTestId("proposal-terms-dialog");
    fireEvent.click(within(screen.getByTestId("proposal-accept-program-terms")).getByRole("checkbox"));
    fireEvent.click(within(screen.getByTestId("proposal-accept-app-terms")).getByRole("checkbox"));
    await waitFor(() => expect(screen.getByTestId("proposal-submit-confirm").hasAttribute("disabled")).toBe(false));
    fireEvent.click(screen.getByTestId("proposal-submit-confirm"));

    const refused = await screen.findByTestId("proposal-refused-message");
    expect(refused.textContent).toContain(NOT_ACCEPTING_PROPOSALS);
    expect(screen.queryByText("Page not found")).toBeNull();
    expect(requests.find((request) => request.method === "POST")?.body).toMatchObject({ status: "SUBMITTED" });
  });

  it("is the missing page for an opportunity the service does not show", async () => {
    serve((method, path) => (path === `/api/opportunities/code-with-us/${OPPORTUNITY}` ? json(404, {}) : json(200, [])));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(CREATE);
    expect(await screen.findByText("Page not found")).toBeTruthy();
  });
});

describe("the manage page (R-2.4, R-2.9, R-2.15, R-2.23)", () => {
  function manage(current: Record<string, unknown>, onWrite: (method: string, path: string, body: unknown) => Response) {
    serve((method, path, body) => {
      if (method !== "GET") return onWrite(method, path, body);
      if (path === `/api/proposals/code-with-us/${PROPOSAL}`) return json(200, proposal(current));
      return json(200, []);
    });
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
  }

  const actions = () =>
    within(screen.getByTestId("proposal-actions"))
      .queryAllByRole("button")
      .map((button) => button.textContent);

  it("offers a draft Edit, Submit proposal and Delete, and deletes it after asking", async () => {
    manage({ status: "DRAFT", submittedAt: null }, () => json(200, proposal({ status: "DRAFT" })));
    const { router } = renderAt(MANAGE);
    expect((await screen.findByTestId("proposal-status")).textContent).toBe("Draft");
    expect(actions()).toEqual(["Edit", "Submit proposal", "Delete"]);
    expect(screen.queryByTestId("proposal-submitted-at")).toBeNull();
    expect(screen.getByTestId("opportunity-identifier").textContent).toBe(OPPORTUNITY);

    fireEvent.click(screen.getByTestId("proposal-delete-button"));
    fireEvent.click(await screen.findByTestId("proposal-delete-confirm"));
    await waitFor(() => expect(router.state.location.pathname).toBe("/dashboard"));
    expect(requests.find((request) => request.method === "DELETE")?.address).toBe(`/api/proposals/code-with-us/${PROPOSAL}`);
  });

  it("offers a submitted proposal Edit and Withdraw, and withdraws it after asking", async () => {
    manage({}, () => json(200, proposal({ status: "WITHDRAWN" })));
    renderAt(MANAGE);
    expect((await screen.findByTestId("proposal-status")).textContent).toBe("Submitted");
    expect(screen.getByTestId("proposal-submitted-at").textContent).not.toBe("");
    expect(actions()).toEqual(["Edit", "Withdraw"]);

    fireEvent.click(screen.getByTestId("proposal-withdraw-button"));
    fireEvent.click(await screen.findByTestId("proposal-withdraw-confirm"));
    await waitFor(() => expect(screen.getByTestId("proposal-status").textContent).toBe("Withdrawn"));
    expect(requests.find((request) => request.method === "PUT")?.body).toEqual({ tag: "withdraw" });
    expect(actions()).toEqual(["Edit", "Submit proposal"]);
  });

  it("says so when putting a withdrawn proposal back is refused after the deadline, and it stays withdrawn", async () => {
    manage({ status: "WITHDRAWN" }, (_method, path) =>
      path.startsWith("/api/users/") ? json(200, vendor) : json(400, { errors: [NOT_ACCEPTING_PROPOSALS] }),
    );
    renderAt(MANAGE);
    fireEvent.click(await screen.findByTestId("proposal-submit"));
    await screen.findByTestId("proposal-terms-dialog");
    fireEvent.click(within(screen.getByTestId("proposal-accept-program-terms")).getByRole("checkbox"));
    fireEvent.click(within(screen.getByTestId("proposal-accept-app-terms")).getByRole("checkbox"));
    await waitFor(() => expect(screen.getByTestId("proposal-submit-confirm").hasAttribute("disabled")).toBe(false));
    fireEvent.click(screen.getByTestId("proposal-submit-confirm"));

    expect((await screen.findByTestId("proposal-submit-refused-message")).textContent).toContain(NOT_ACCEPTING_PROPOSALS);
    expect(screen.getByTestId("proposal-status").textContent).toBe("Withdrawn");
  });

  it("checks a draft before asking for the terms, except after the deadline, when the service says why", async () => {
    manage({ status: "DRAFT", submittedAt: null, proposalText: "" }, () => json(200, proposal()));
    const view = renderAt(MANAGE);
    fireEvent.click(await screen.findByTestId("proposal-submit"));
    expect((await screen.findAllByTestId("field-error")).map((error) => error.textContent)).toEqual([
      "Proposal: enter your proposal, up to 10,000 characters",
    ]);
    expect(screen.queryByTestId("proposal-terms-dialog")).toBeNull();
    view.unmount();

    const lapsed = { id: OPPORTUNITY, title: "Lapsed", status: "PUBLISHED", proposalDeadline: "2026-01-01", reward: 5000 };
    manage({ status: "DRAFT", submittedAt: null, proposalText: "", opportunity: lapsed }, () => json(200, proposal()));
    renderAt(MANAGE);
    fireEvent.click(await screen.findByTestId("proposal-submit"));
    expect(await screen.findByTestId("proposal-terms-dialog")).toBeTruthy();
  });

  it("opens the create page's form, filled in, and saves changes", async () => {
    manage({ status: "DRAFT", submittedAt: null }, () => json(200, proposal({ status: "DRAFT", proposalText: "Changed." })));
    renderAt(MANAGE);
    fireEvent.click(await screen.findByTestId("proposal-edit-button"));
    expect(field("proposal-legal-name-field").value).toBe(individual.legalName);
    expect(screen.queryByTestId("proposal-actions")).toBeNull();
    type("proposal-text-field", "Changed.");
    fireEvent.click(screen.getByTestId("proposal-save-changes"));
    await waitFor(() => expect(screen.getByTestId("proposal-actions")).toBeTruthy());
    expect(requests.find((request) => request.method === "PUT")?.body).toMatchObject({ tag: "edit", value: { proposalText: "Changed." } });
  });

  it("shows the history, newest first, with who made each change", async () => {
    manage({}, () => json(200, proposal()));
    renderAt(`${MANAGE}?tab=history`);
    const table = await screen.findByTestId("proposal-history-table");
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows.map((row) => within(row).getAllByRole("cell")[1]!.textContent)).toEqual(["Submitted", "Draft created"]);
    expect(within(rows[0]!).getByText(vendor.name)).toBeTruthy();
  });

  it("is the missing page for a proposal the service will not show, and for staff", async () => {
    serve(() => json(404, { errors: ["No proposal is held at that address."] }));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const view = renderAt(MANAGE);
    await screen.findByTestId("not-found-page");
    view.unmount();

    serve(() => json(200, proposal()));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt(MANAGE);
    await screen.findByTestId("not-found-page");
  });
});

describe("what a machine can check of WCAG 2.1 AA (constitution P1)", () => {
  async function problemsIn(container: HTMLElement): Promise<string[]> {
    const results = await axe.run(container, { resultTypes: ["violations"], rules: { "color-contrast": { enabled: false } } });
    return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
  }

  it("finds nothing on the create page, the manage page or the vendor's dashboard", async () => {
    aNewProposal();
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const create = renderAt(CREATE);
    await screen.findByTestId("proposal-submit");
    expect(await problemsIn(create.container)).toEqual([]);
    create.unmount();

    serve((_method, path) => (path === `/api/proposals/code-with-us/${PROPOSAL}` ? json(200, proposal()) : json(200, [])));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const manage = renderAt(MANAGE);
    await screen.findByTestId("proposal-actions");
    expect(await problemsIn(manage.container)).toEqual([]);
    manage.unmount();

    serve((_method, path) => (path === "/api/proposals/code-with-us" ? json(200, [proposal()]) : json(200, [])));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const dashboard = renderAt("/dashboard");
    await screen.findByTestId("dashboard-my-proposals-table");
    expect(await problemsIn(dashboard.container)).toEqual([]);
  }, 30_000);
});

describe("the vendor's dashboard (R-2.24, R-4.23)", () => {
  const ownMembership = {
    id: "00000000-0000-4000-8000-000000000404",
    membershipType: "OWNER",
    membershipStatus: "ACTIVE",
    organization: { id: ORGANIZATION, legalName: "Cedar Hollow Systems Inc.", numTeamMembers: 1, swuQualified: false },
  };
  const forOrganization = proposal({
    id: "00000000-0000-4000-8000-000000000a02",
    createdBy: { id: "someone-else", name: "Blake Placeholder" },
    proponent: { tag: "organization", value: { id: ORGANIZATION, legalName: "Cedar Hollow Systems Inc." } },
    status: "DRAFT",
  });

  function dashboard(proposals: unknown[], memberships: unknown[]) {
    serve((_method, path) => {
      if (path === "/api/proposals/code-with-us") return json(200, proposals);
      if (path === "/api/affiliations") return json(200, memberships);
      return json(200, []);
    });
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt("/dashboard");
  }

  it("lists the vendor's own proposals and, under its own heading, their organizations'", async () => {
    dashboard([proposal(), forOrganization], [ownMembership]);
    const mine = await screen.findByTestId("dashboard-my-proposals-table");
    const myRows = within(mine).getAllByTestId("dashboard-proposal-row");
    expect(myRows).toHaveLength(1);
    expect(within(myRows[0]!).getByTestId("proposal-status").textContent).toBe("Submitted");
    expect(within(myRows[0]!).getByTestId("dashboard-proposal-link").getAttribute("href")).toBe(MANAGE);

    const theirs = within(screen.getByTestId("dashboard-org-proposals-table")).getAllByTestId("dashboard-proposal-row");
    expect(theirs).toHaveLength(1);
    expect(within(theirs[0]!).getByText("Blake Placeholder")).toBeTruthy();
    expect(screen.getByTestId("dashboard-show-my-proposals")).toBeTruthy();
    expect(screen.getByTestId("dashboard-show-org-proposals")).toBeTruthy();
  });

  it("says in words when each list is empty", async () => {
    dashboard([], [ownMembership]);
    expect((await screen.findByTestId("dashboard-empty-my-proposals")).textContent).toContain("You have not started any proposals.");
    expect(screen.getByTestId("dashboard-empty-org-proposals").textContent).toBe(
      "No one has started a proposal for an organization you own or administer.",
    );
  });

  it("has no organizations' heading for a vendor who owns and administers none", async () => {
    dashboard([proposal()], [{ ...ownMembership, membershipType: "MEMBER" }]);
    await screen.findByTestId("dashboard-my-proposals-table");
    expect(screen.queryByTestId("dashboard-show-org-proposals")).toBeNull();
    expect(screen.queryByTestId("dashboard-empty-org-proposals")).toBeNull();
  });
});

describe("the read-only proposal page (R-2.24, R-2.25)", () => {
  const VIEW = `/opportunities/code-with-us/${OPPORTUNITY}/proposals/${PROPOSAL}`;

  function reading(answer: () => Response, who: Account) {
    serve((_method, path) => (path === `/api/proposals/code-with-us/${PROPOSAL}` ? answer() : json(200, [])));
    resetSessionForTests({ status: "signed-in", account: who }, fakeIdentity());
  }

  it("shows its author the proposal, who proposed, its state and its identifier, with a way to manage it", async () => {
    reading(() => json(200, proposal()), vendor);
    renderAt(VIEW);
    expect((await screen.findByTestId("proposal-proponent-name")).textContent).toBe(individual.legalName);
    expect(screen.getByTestId("proposal-status").textContent).toBe("Submitted");
    expect(screen.getByTestId("proposal-identifier").textContent).toBe(PROPOSAL);
    expect(screen.getByTestId("proposal-tab-proposal").getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("We will build it.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Manage this proposal" }).getAttribute("href")).toBe(`${VIEW}/edit`);
    expect(screen.queryByTestId("proposal-score")).toBeNull();
  });

  it("names the organization a proposal is put forward for", async () => {
    const forOrganization = { tag: "organization", value: { id: ORGANIZATION, legalName: "Cedar Hollow Systems Inc." } };
    reading(() => json(200, proposal({ proponent: forOrganization })), vendor);
    renderAt(VIEW);
    expect((await screen.findByTestId("proposal-proponent-name")).textContent).toBe("Cedar Hollow Systems Inc.");
  });

  it("shows staff the score the service gives them, and not yet scored until there is one", async () => {
    reading(() => json(200, proposal({ status: "UNDER_REVIEW", score: null })), staff);
    renderAt(VIEW);
    expect((await screen.findByTestId("proposal-score")).textContent).toBe("Not yet scored");
    expect(screen.queryByRole("link", { name: "Manage this proposal" })).toBeNull();
  });

  it("lists the history on its own tab", async () => {
    reading(() => json(200, proposal()), vendor);
    renderAt(`${VIEW}?tab=history`);
    const table = await screen.findByTestId("proposal-history-table");
    expect(within(table).getAllByRole("row")).toHaveLength(3);
  });

  it("is the missing page for a proposal the service will not show, such as another vendor's", async () => {
    const another = account({ id: "00000000-0000-4000-8000-000000000211" });
    reading(() => json(404, { errors: ["No proposal is held at that address."] }), another);
    renderAt(VIEW);
    await screen.findByTestId("not-found-page");
    expect(screen.queryByTestId("proposal-proponent-name")).toBeNull();
  });

  it("is the missing page for a proposal reached through another opportunity's address", async () => {
    reading(() => json(200, proposal()), vendor);
    renderAt(`/opportunities/code-with-us/00000000-0000-4000-8000-000000000699/proposals/${PROPOSAL}`);
    await screen.findByTestId("not-found-page");
  });
});

describe("the opportunity's Proposals tab (R-1.31, R-2.25)", () => {
  const MANAGE_OPPORTUNITY = `/opportunities/code-with-us/${OPPORTUNITY}/edit`;
  const TAB = `${MANAGE_OPPORTUNITY}?tab=proposals`;
  const author = { id: staff.id, name: staff.name };

  function managing(listing: () => Response, who: Account, overrides: Record<string, unknown> = {}) {
    serve((_method, path) => {
      if (path === `/api/opportunities/code-with-us/${OPPORTUNITY}`) {
        return json(200, opportunity({ createdBy: author, updatedBy: author, history: [], ...overrides }));
      }
      if (path === "/api/proposals/code-with-us") return listing();
      return json(200, []);
    });
    resetSessionForTests({ status: "signed-in", account: who }, fakeIdentity());
  }

  it("is offered once the opportunity is no longer a draft, and not on a draft", async () => {
    managing(() => json(200, []), staff, { status: "DRAFT" });
    const view = renderAt(MANAGE_OPPORTUNITY);
    await screen.findByTestId("opportunity-tab-summary");
    expect(screen.queryByTestId("opportunity-tab-proposals")).toBeNull();
    view.unmount();

    managing(() => json(200, []), staff);
    renderAt(MANAGE_OPPORTUNITY);
    expect((await screen.findByTestId("opportunity-tab-proposals")).getAttribute("href")).toBe(TAB);
  });

  for (const [who, reader] of [
    ["the author", staff],
    ["an administrator", administrator],
  ] as const) {
    it(`withholds every proposal from ${who} while the opportunity is open`, async () => {
      const refusal = { errors: ["An opportunity's proposals can be seen only by its author and administrators, once it has closed."] };
      managing(() => json(401, refusal), reader);
      renderAt(TAB);
      const withheld = await screen.findByTestId("opportunity-proposals-withheld-message");
      expect(withheld.textContent).toContain("not shown until the opportunity closes");
      expect(screen.queryByTestId("proposal-proponent-name")).toBeNull();
      expect(requests.some((request) => request.address === `/api/proposals/code-with-us?opportunity=${OPPORTUNITY}`)).toBe(true);
    });
  }

  it("lists the submitted proposals once closed, each opening on its own page, and never a draft", async () => {
    const drafted = { tag: "individual", value: { ...individual, legalName: "Drafty" } };
    const draft = proposal({ id: "00000000-0000-4000-8000-000000000a09", status: "DRAFT", proponent: drafted });
    managing(() => json(200, [proposal({ status: "UNDER_REVIEW" }), draft]), staff, { status: "EVALUATION", proposalDeadline: "2026-09-01" });
    renderAt(TAB);
    const table = await screen.findByTestId("opportunity-proposals-table");
    const rows = within(table).getAllByTestId("opportunity-proposal-row");
    expect(rows).toHaveLength(1);
    expect(within(rows[0]!).getByTestId("proposal-proponent-name").textContent).toBe(individual.legalName);
    expect(within(rows[0]!).getByTestId("proposal-status").textContent).toBe("Under review");
    expect(within(rows[0]!).getByTestId("opportunity-proposal-link").getAttribute("href")).toBe(
      `/opportunities/code-with-us/${OPPORTUNITY}/proposals/${PROPOSAL}`,
    );
    expect(screen.queryByText("Drafty")).toBeNull();
  });

  it("leaves a machine nothing to find on the tab or on the proposal it opens (constitution P1)", async () => {
    const problemsIn = async (container: HTMLElement) =>
      (await axe.run(container, { resultTypes: ["violations"], rules: { "color-contrast": { enabled: false } } })).violations.map(
        (violation) => `${violation.id}: ${violation.help}`,
      );
    managing(() => json(200, [proposal({ status: "UNDER_REVIEW" })]), staff, { status: "EVALUATION", proposalDeadline: "2026-09-01" });
    const tab = renderAt(TAB);
    await screen.findByTestId("opportunity-proposals-table");
    expect(await problemsIn(tab.container)).toEqual([]);
    tab.unmount();

    serve(() => json(200, proposal({ status: "UNDER_REVIEW", score: 87 })));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    const view = renderAt(`/opportunities/code-with-us/${OPPORTUNITY}/proposals/${PROPOSAL}`);
    expect((await screen.findByTestId("proposal-score")).textContent).toBe("87%");
    expect(await problemsIn(view.container)).toEqual([]);
  }, 30_000);

  it("says in words when nothing was submitted", async () => {
    managing(() => json(200, []), administrator, { status: "EVALUATION", proposalDeadline: "2026-09-01" });
    renderAt(TAB);
    expect((await screen.findByTestId("opportunity-proposals-empty")).textContent).toBe("No proposals were submitted to this opportunity.");
  });
});
