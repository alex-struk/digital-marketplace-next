import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DISQUALIFY_REASON_MESSAGE, SCORE_MESSAGE } from "@rules/proposal-evaluation";
import type { Account } from "../src/api/accounts";
import type { IdentityClient } from "../src/auth/identity-client";
import { resetSessionForTests } from "../src/auth/session";
import { routeTree } from "../src/router";
import { scoreFromField } from "../src/screens/proposal-evaluation-actions";

/**
 * Evaluating a Code With Us proposal once its opportunity has closed, as the screens do it
 * (proposal-cwu-view for the opportunity's author and administrators, proposal-cwu-edit for the
 * vendor afterwards, opportunity-cwu-view once awarded). The service is stood in for; what is
 * checked is what the screens offer, show and ask of it.
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

const OPPORTUNITY = "00000000-0000-4000-a002-000000000001";
const PROPOSAL = "00000000-0000-4000-a002-000000000101";
const VIEW = `/opportunities/code-with-us/${OPPORTUNITY}/proposals/${PROPOSAL}`;

const proposal = (overrides: Record<string, unknown> = {}) => ({
  id: PROPOSAL,
  program: "code-with-us",
  createdAt: "2026-09-12T17:30:00.000Z",
  updatedAt: "2026-09-15T21:12:00.000Z",
  createdBy: { id: vendor.id, name: vendor.name },
  updatedBy: { id: vendor.id, name: vendor.name },
  status: "UNDER_REVIEW",
  submittedAt: "2026-09-15T21:12:00.000Z",
  opportunity: { id: OPPORTUNITY, title: "Build a tracker", status: "EVALUATION", proposalDeadline: "2026-09-02", reward: 5000 },
  proposalText: "We will build it.",
  additionalComments: "",
  proponent: { tag: "organization", value: { id: "00000000-0000-4000-8000-000000000301", legalName: "Northern Pines Digital" } },
  attachments: [],
  anonymousProponentName: "",
  score: null,
  rank: null,
  history: [
    { createdAt: "2026-09-02T23:00:00.000Z", createdBy: null, status: "UNDER_REVIEW", event: null, note: "The opportunity closed." },
    { createdAt: "2026-09-15T21:12:00.000Z", createdBy: { id: vendor.id, name: vendor.name }, status: "SUBMITTED", event: null, note: null },
  ],
  ...overrides,
});

const requests: { method: string; address: string; body: unknown }[] = [];

function serve(handler: (method: string, path: string, body: unknown) => Response | Promise<Response>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: Request) => {
      const type = input.headers.get("content-type") ?? "";
      const body = type.includes("application/json") ? JSON.parse(await input.clone().text()) : undefined;
      const url = new URL(input.url);
      requests.push({ method: input.method, address: url.pathname, body });
      return handler(input.method, url.pathname, body);
    }),
  );
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function renderAt(address: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [address] }) });
  return render(<RouterProvider router={router as never} />);
}

const field = (testId: string) =>
  screen.getByTestId(testId).querySelector("input, textarea") as HTMLInputElement | HTMLTextAreaElement;

const writes = () => requests.filter((request) => request.method !== "GET");

/** The service as the proposal page meets it, answering each change with what `onChange` gives. */
function evaluating(who: Account, start: Record<string, unknown>, onChange: (body: { tag: string; value?: unknown }) => Response) {
  serve((method, path, body) => {
    if (path === `/api/proposals/code-with-us/${PROPOSAL}`) {
      return method === "PUT" ? onChange(body as { tag: string; value?: unknown }) : json(200, proposal(start));
    }
    return json(200, []);
  });
  resetSessionForTests({ status: "signed-in", account: who }, fakeIdentity());
}

beforeEach(() => {
  requests.length = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetSessionForTests();
});

describe("scoring (R-2.26, R-2.35)", () => {
  it("offers the author Enter score and Disqualify on a proposal under review, and no Award", async () => {
    evaluating(staff, {}, () => json(500, {}));
    renderAt(VIEW);
    const actions = await screen.findByTestId("proposal-actions");
    expect(within(actions).getByTestId("proposal-enter-score")).toBeTruthy();
    expect(within(actions).getByTestId("proposal-disqualify-button")).toBeTruthy();
    expect(within(actions).queryByTestId("proposal-award-button")).toBeNull();
  });

  it("refuses a score above 100 at the field, sending nothing, then enters 87 and shows the score and rank", async () => {
    const scored = proposal({
      status: "EVALUATED",
      score: 87,
      rank: { rank: 1, of: 2 },
      opportunity: { id: OPPORTUNITY, title: "Build a tracker", status: "EVALUATION", proposalDeadline: "2026-09-02", reward: 5000 },
    });
    evaluating(staff, {}, () => json(200, scored));
    renderAt(VIEW);
    fireEvent.click(await screen.findByTestId("proposal-enter-score"));
    await screen.findByTestId("proposal-score-dialog");

    fireEvent.change(field("proposal-score-field"), { target: { value: "104" } });
    fireEvent.click(screen.getByTestId("proposal-score-confirm"));
    expect(await screen.findByText(SCORE_MESSAGE)).toBeTruthy();
    expect(writes()).toEqual([]);

    fireEvent.change(field("proposal-score-field"), { target: { value: "87" } });
    fireEvent.click(screen.getByTestId("proposal-score-confirm"));
    await waitFor(() => expect(screen.getByTestId("proposal-status").textContent).toBe("Evaluated"));
    expect(writes()[0]?.body).toEqual({ tag: "score", value: 87 });
    expect(screen.getByTestId("proposal-score").textContent).toBe("87%");
    expect(screen.getByTestId("proposal-rank").textContent).toBe("1 of 2");
    expect(within(screen.getByTestId("proposal-actions")).getByTestId("proposal-award-button")).toBeTruthy();
    expect(screen.queryByTestId("proposal-score-dialog")).toBeNull();
  });

  it("reads what was typed into the score field as the service would", () => {
    expect(scoreFromField("87")).toBe(87);
    expect(scoreFromField(" 87.5 ")).toBe(87.5);
    expect(scoreFromField("104")).toBeNull();
    expect(scoreFromField("87.123")).toBeNull();
    expect(scoreFromField("")).toBeNull();
  });

  it("lists a score's entry in the history", async () => {
    const history = [
      { createdAt: "2026-10-07T18:20:00.001Z", createdBy: { id: staff.id, name: staff.name }, status: null, event: "SCORE_ENTERED", note: 'A score of "87%" was entered.' },
      { createdAt: "2026-10-07T18:20:00.000Z", createdBy: { id: staff.id, name: staff.name }, status: "EVALUATED", event: null, note: null },
    ];
    evaluating(staff, { status: "EVALUATED", score: 87, history }, () => json(500, {}));
    renderAt(`${VIEW}?tab=history`);
    const table = await screen.findByTestId("proposal-history-table");
    const rows = within(table).getAllByRole("row");
    expect(rows[1]?.textContent).toContain("Score entered: 87%");
    expect(rows[1]?.textContent).toContain(staff.name);
    expect(rows[2]?.textContent).toContain("Evaluated");
  });
});

describe("disqualifying (R-2.34)", () => {
  it("needs a reason, and sends it", async () => {
    evaluating(staff, {}, () => json(200, proposal({ status: "DISQUALIFIED" })));
    renderAt(VIEW);
    fireEvent.click(await screen.findByTestId("proposal-disqualify-button"));
    await screen.findByTestId("proposal-disqualify-dialog");
    fireEvent.click(screen.getByTestId("proposal-disqualify-confirm"));
    expect(await screen.findByText(DISQUALIFY_REASON_MESSAGE)).toBeTruthy();
    expect(writes()).toEqual([]);

    fireEvent.change(field("proposal-disqualify-reason-field"), { target: { value: "It did not meet the criteria." } });
    fireEvent.click(screen.getByTestId("proposal-disqualify-confirm"));
    await waitFor(() => expect(screen.getByTestId("proposal-status").textContent).toBe("Disqualified"));
    expect(writes()[0]?.body).toEqual({ tag: "disqualify", value: "It did not meet the criteria." });
  });
});

describe("awarding (R-2.33, R-2.36)", () => {
  const evaluated = {
    status: "EVALUATED",
    score: 87,
    rank: { rank: 1, of: 2 },
    opportunity: { id: OPPORTUNITY, title: "Build a tracker", status: "PROCESSING", proposalDeadline: "2026-09-02", reward: 5000 },
  };

  it("asks first, saying who is told, then awards", async () => {
    evaluating(staff, evaluated, () =>
      json(200, proposal({ ...evaluated, status: "AWARDED", opportunity: { ...evaluated.opportunity, status: "AWARDED" } })),
    );
    renderAt(VIEW);
    fireEvent.click(await screen.findByTestId("proposal-award-button"));
    const dialog = await screen.findByTestId("proposal-award-dialog");
    expect(dialog.textContent).toContain("decision notice");
    fireEvent.click(screen.getByTestId("proposal-award-confirm"));
    await waitFor(() => expect(screen.getByTestId("proposal-status").textContent).toBe("Awarded"));
    expect(writes()[0]?.body).toEqual({ tag: "award" });
  });

  it("says why when the service refuses", async () => {
    evaluating(staff, evaluated, () => json(400, { errors: ["Only an evaluated proposal, on an opportunity not yet awarded, can be awarded."] }));
    renderAt(VIEW);
    fireEvent.click(await screen.findByTestId("proposal-award-button"));
    fireEvent.click(await screen.findByTestId("proposal-award-confirm"));
    const refused = await screen.findByTestId("proposal-refused-message");
    expect(refused.textContent).toContain("can be awarded");
  });

  it("offers a vendor none of it", async () => {
    evaluating(vendor, evaluated, () => json(500, {}));
    renderAt(VIEW);
    await screen.findByTestId("proposal-proponent-name");
    expect(screen.queryByTestId("proposal-actions")).toBeNull();
  });

  it("leaves a machine nothing to find on the page or in the score dialog (constitution P1)", async () => {
    evaluating(staff, {}, () => json(500, {}));
    const view = renderAt(VIEW);
    fireEvent.click(await screen.findByTestId("proposal-enter-score"));
    await screen.findByTestId("proposal-score-dialog");
    const results = await axe.run(document.body, { resultTypes: ["violations"], rules: { "color-contrast": { enabled: false } } });
    expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
    view.unmount();
  }, 30_000);
});

describe("the vendor's own result (R-2.32)", () => {
  it("shows the score and rank on the manage page once decided", async () => {
    serve((_method, path) =>
      path === `/api/proposals/code-with-us/${PROPOSAL}`
        ? json(200, proposal({ status: "NOT_AWARDED", score: 80, rank: { rank: 2, of: 3 } }))
        : json(200, []),
    );
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(`${VIEW}/edit`);
    expect((await screen.findByTestId("proposal-score")).textContent).toBe("80%");
    expect(screen.getByTestId("proposal-rank").textContent).toBe("2 of 3");
  });
});

describe("an awarded opportunity (R-1.27)", () => {
  const awarded = (successfulProponent: Record<string, unknown>) => ({
    id: OPPORTUNITY,
    program: "code-with-us",
    createdAt: "2026-08-01T17:00:00.000Z",
    updatedAt: "2026-08-01T17:00:00.000Z",
    status: "AWARDED",
    publishedAt: "2026-08-02T17:00:00.000Z",
    title: "Build a tracker",
    teaser: "",
    remoteOk: false,
    remoteDesc: "",
    location: "Victoria",
    reward: 5000,
    skills: [],
    description: "What the work is.",
    proposalDeadline: "2026-09-02",
    assignmentDate: "2026-09-12",
    startDate: "2026-09-22",
    completionDate: null,
    attachments: [],
    addenda: [],
    subscribed: false,
    successfulProponent,
  });

  function viewing(successfulProponent: Record<string, unknown>) {
    serve((_method, path) => (path === `/api/opportunities/code-with-us/${OPPORTUNITY}` ? json(200, awarded(successfulProponent)) : json(200, [])));
    resetSessionForTests({ status: "visitor" }, fakeIdentity());
  }

  it("names its successful proponent to anybody, and nothing more", async () => {
    viewing({ name: "Northern Pines Digital" });
    renderAt(`/opportunities/code-with-us/${OPPORTUNITY}`);
    expect((await screen.findByTestId("opportunity-successful-proponent")).textContent).toBe("Northern Pines Digital");
    expect(screen.queryByText("Contact details")).toBeNull();
    expect(screen.queryByText("91%")).toBeNull();
  });

  it("shows the winning organization's contact person on its proposal when the service gives it", async () => {
    const contact = { name: "Blake Placeholder", email: "org.owner@example.test", phone: "250-555-0101" };
    evaluating(
      staff,
      {
        status: "AWARDED",
        score: 91,
        proponent: { tag: "organization", value: { id: "00000000-0000-4000-8000-000000000301", legalName: "Northern Pines Digital", contact } },
      },
      () => json(500, {}),
    );
    renderAt(`${VIEW}?tab=proposal`);
    await screen.findByTestId("proposal-proponent-name");
    expect(screen.getByText("Blake Placeholder")).toBeTruthy();
    expect(screen.getByText("org.owner@example.test")).toBeTruthy();
    expect(screen.getByText("250-555-0101")).toBeTruthy();
  });

  it("gives no contact person on a proposal when the service gives none", async () => {
    evaluating(vendor, { status: "UNDER_REVIEW" }, () => json(500, {}));
    renderAt(`${VIEW}?tab=proposal`);
    await screen.findByTestId("proposal-proponent-name");
    expect(screen.queryByText("Contact email")).toBeNull();
  });

  it("shows the contact details and score when the service gives them", async () => {
    viewing({ name: "Northern Pines Digital", email: "contact@example.test", phone: "250-555-0100", score: 91 });
    renderAt(`/opportunities/code-with-us/${OPPORTUNITY}`);
    await screen.findByTestId("opportunity-successful-proponent");
    expect(screen.getByText("contact@example.test, 250-555-0100")).toBeTruthy();
    expect(screen.getByText("91%")).toBeTruthy();
  });
});
