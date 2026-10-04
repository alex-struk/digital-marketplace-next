import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INCOMPLETE_EVALUATION } from "@rules/individual-evaluation";
import type { Account } from "../src/api/accounts";
import type { IdentityClient } from "../src/auth/identity-client";
import { resetSessionForTests } from "../src/auth/session";
import { routeTree } from "../src/router";
import { panelRows } from "../src/screens/dashboard";
import { chosenTab } from "../src/screens/opportunity-other-manage";

/**
 * Panel evaluators scoring proponents individually, as the screens do it (decision record 0062):
 * the dashboard's Evaluations section (evaluation-panel-dashboard), the evaluator's tabs on the
 * manage page (evaluation-instructions-*, evaluation-individual-list-*), and one proponent's
 * evaluation (evaluation-individual-create-*, -edit-*). The service is stood in for; what is checked
 * is what the screens offer, show and ask of it.
 */

function account(overrides: Partial<Account>): Account {
  return {
    id: "00000000-0000-4000-8000-000000000102",
    type: "GOV",
    status: "ACTIVE",
    name: "Casey Placeholder",
    email: "staff.one@example.test",
    jobTitle: null,
    avatarImageFile: null,
    notificationsOn: null,
    acceptedTermsAt: null,
    lastAcceptedTermsAt: null,
    idpUsername: "test-gov",
    capabilities: [],
    deactivatedOn: null,
    deactivatedBy: null,
    ...overrides,
  };
}

const evaluator = account({});
const owner = { id: "00000000-0000-4000-8000-000000000103", name: "Jordan Placeholder" };
const chair = account({ id: "00000000-0000-4000-8000-000000000104", name: "Riley Placeholder" });
const stranger = account({ id: "00000000-0000-4000-8000-000000000105", name: "Sam Placeholder" });

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

const ID = "00000000-0000-4000-8000-000000000701";
const P1 = "00000000-0000-4000-8000-000000000741";
const P2 = "00000000-0000-4000-8000-000000000742";
const P3 = "00000000-0000-4000-8000-000000000743";
const MANAGE = `/opportunities/sprint-with-us/${ID}/edit`;

const questions = [0, 1].map((order) => ({
  question: `Seeded team question ${order + 1}.`,
  guideline: "Answer in your own words.",
  score: 5,
  minimumScore: order === 1 ? 3 : null,
  wordLimit: 300,
  order,
}));

const proponents = [P1, P2, P3].map((id, index) => ({
  id,
  anonymousProponentName: `Proponent ${index + 1}`,
  status: "UNDER_REVIEW_QUESTIONS",
  responses: [0, 1].map((order) => ({ order, response: `Proponent ${index + 1}'s answer to question ${order + 1}.` })),
}));

const sprint = (overrides: Record<string, unknown> = {}) => ({
  id: ID,
  program: "sprint-with-us",
  createdAt: "2026-09-01T17:00:00.000Z",
  updatedAt: "2026-09-01T17:00:00.000Z",
  status: "EVAL_QUESTIONS_INDIVIDUAL",
  publishedAt: "2026-09-01T18:00:00.000Z",
  title: "Seeded closed Sprint With Us opportunity",
  teaser: "",
  location: "Victoria",
  remoteOk: true,
  remoteDesc: "",
  description: "",
  proposalDeadline: "2026-09-04",
  assignmentDate: "2026-09-14",
  totalMaxBudget: 500000,
  mandatorySkills: [],
  inceptionPhase: null,
  prototypePhase: null,
  implementationPhase: null,
  teamQuestions: questions,
  questionsWeight: 25,
  codeChallengeWeight: 40,
  scenarioWeight: 15,
  priceWeight: 20,
  evaluationPanel: [
    { user: { id: evaluator.id, name: evaluator.name }, evaluator: true, chair: false, order: 0 },
    { user: { id: chair.id, name: chair.name }, evaluator: false, chair: true, order: 1 },
  ],
  proponents,
  subscribed: false,
  addenda: [],
  ...overrides,
});

const evaluation = (proposal: string, name: string, status: "DRAFT" | "SUBMITTED", scores: { score: number | null; notes: string }[]) => ({
  proposal: { id: proposal, anonymousProponentName: name },
  evaluationPanelMember: { id: evaluator.id, name: evaluator.name },
  status,
  scores: scores.map((entry, order) => ({ order, ...entry })),
  createdAt: "2026-10-01T17:00:00.000Z",
  updatedAt: "2026-10-01T17:00:00.000Z",
});

const complete = [
  { score: 4, notes: "Clear plan." },
  { score: 3.5, notes: "Credible." },
];

const requests: { method: string; address: string; body: unknown }[] = [];

function serve(handler: (method: string, path: string, body: unknown) => Response | null) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: Request) => {
      const type = input.headers.get("content-type") ?? "";
      const body = type.includes("application/json") ? JSON.parse(await input.clone().text()) : undefined;
      const url = new URL(input.url);
      requests.push({ method: input.method, address: url.pathname, body });
      if (input.method === "GET" && url.pathname === "/api/sessions/current") return json(200, { id: "s", user: evaluator, panelCandidates: [] });
      if (url.pathname === "/api/content/sprint-with-us-evaluation-instructions") {
        return json(200, {
          id: "p",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          slug: "sprint-with-us-evaluation-instructions",
          title: "Evaluation instructions",
          body: "Score each proponent on your own.",
          fixed: true,
        });
      }
      return handler(input.method, url.pathname, body) ?? json(404, { errors: ["Not here."] });
    }),
  );
}

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function renderAt(address: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [address] }) });
  render(<RouterProvider router={router as never} />);
  return router;
}

const writes = () => requests.filter((request) => request.method !== "GET");

beforeEach(() => {
  requests.length = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetSessionForTests();
});

describe("the dashboard's Evaluations section (R-5.19)", () => {
  const listed = (id: string, title: string, status: string, panel: unknown) => ({
    id,
    program: "sprint-with-us",
    status,
    title,
    location: "",
    remoteOk: true,
    remoteDesc: "",
    proposalDeadline: "2030-01-01",
    createdAt: "2026-09-01T17:00:00.000Z",
    updatedAt: "2026-09-01T17:00:00.000Z",
    createdBy: owner,
    totalMaxBudget: 1,
    subscribed: false,
    ...(panel ? { evaluationPanel: panel } : {}),
  });

  it("lists the opportunities the person sits on the panel of, a draft included, with their role", async () => {
    serve((method, path) =>
      method === "GET" && path === "/api/opportunities/sprint-with-us"
        ? json(200, [
            listed(ID, "A draft I evaluate", "DRAFT", [{ user: { id: evaluator.id, name: evaluator.name }, evaluator: true, chair: true, order: 0 }]),
            listed(P1, "Somebody else's", "PUBLISHED", undefined),
          ])
        : method === "GET" && path.startsWith("/api/opportunities/")
          ? json(200, [])
          : null,
    );
    resetSessionForTests({ status: "signed-in", account: evaluator }, fakeIdentity());
    renderAt("/dashboard");
    const table = await screen.findByTestId("dashboard-panel-opportunities-table");
    const rows = within(table).getAllByTestId("dashboard-panel-opportunity-row");
    expect(rows).toHaveLength(1);
    expect(within(rows[0]!).getByTestId("dashboard-opportunity-link").getAttribute("href")).toBe(`/opportunities/sprint-with-us/${ID}/edit`);
    expect(rows[0]!.textContent).toContain("Evaluator and chair");
    expect(within(rows[0]!).getByTestId("opportunity-status").textContent).toBe("Draft");
    expect(screen.getByTestId("dashboard-show-evaluations").getAttribute("href")).toBe("#evaluations");
    expect(screen.getByTestId("dashboard-show-my-opportunities")).toBeTruthy();
  });

  it("says so when the person sits on no panel", async () => {
    serve((method, path) => (method === "GET" && path.startsWith("/api/opportunities/") ? json(200, []) : null));
    resetSessionForTests({ status: "signed-in", account: evaluator }, fakeIdentity());
    renderAt("/dashboard");
    expect((await screen.findByTestId("dashboard-empty-panel-message")).textContent).toContain("You are not on the evaluation panel");
    expect(screen.queryByTestId("dashboard-panel-opportunities-table")).toBeNull();
  });

  it("reads the role from the person's own seat", () => {
    const seat = (evaluatorFlag: boolean, chairFlag: boolean) => ({
      ...listed(ID, "x", "PUBLISHED", undefined),
      program: "sprint-with-us" as const,
      status: "PUBLISHED" as const,
      value: { term: "", amount: 0 },
      evaluationPanel: [{ user: { id: evaluator.id, name: "" }, evaluator: evaluatorFlag, chair: chairFlag }],
    });
    expect(panelRows(evaluator, [seat(false, true)]).map((row) => row.role)).toEqual(["Chair"]);
    expect(panelRows(evaluator, [seat(true, false)]).map((row) => row.role)).toEqual(["Evaluator"]);
    expect(panelRows(stranger, [seat(true, true)])).toEqual([]);
  });
});

describe("the evaluator's tabs on the manage page (R-5.34)", () => {
  it("offers an evaluator who neither owns nor chairs it only the instructions and their evaluations, opening on the instructions", async () => {
    serve((method, path) => (method === "GET" && path === `/api/opportunities/sprint-with-us/${ID}` ? json(200, sprint()) : null));
    resetSessionForTests({ status: "signed-in", account: evaluator }, fakeIdentity());
    renderAt(MANAGE);
    const body = await screen.findByTestId("evaluation-instructions-body");
    await waitFor(() => expect(body.textContent).toContain("Score each proponent on your own."));
    expect(screen.getByTestId("opportunity-tab-instructions").getAttribute("aria-current")).toBe("page");
    expect(screen.getByTestId("opportunity-tab-evaluation")).toBeTruthy();
    for (const absent of ["opportunity-tab-summary", "opportunity-tab-evaluation-panel", "opportunity-tab-consensus", "opportunity-edit-button"]) {
      expect(screen.queryByTestId(absent)).toBeNull();
    }
  });

  it("offers the chair the consensus and not the evaluator's tools, whose address is missing to them", async () => {
    serve((method, path) => (method === "GET" && path === `/api/opportunities/sprint-with-us/${ID}` ? json(200, sprint()) : null));
    resetSessionForTests({ status: "signed-in", account: chair }, fakeIdentity());
    renderAt(`${MANAGE}?tab=instructions`);
    expect(await screen.findByTestId("not-found-page")).toBeTruthy();
  });

  it("shows the missing page to a public sector employee with no connection to it", async () => {
    serve((method, path) => (method === "GET" && path === `/api/opportunities/sprint-with-us/${ID}` ? json(200, sprint({ evaluationPanel: undefined })) : null));
    resetSessionForTests({ status: "signed-in", account: stranger }, fakeIdentity());
    renderAt(MANAGE);
    expect(await screen.findByTestId("not-found-page")).toBeTruthy();
  });

  it("chooses the tab an address asks for among those offered", () => {
    expect(chosenTab(["instructions", "evaluation"], undefined)).toBe("instructions");
    expect(chosenTab(["instructions", "evaluation"], "evaluation")).toBe("evaluation");
    expect(chosenTab(["instructions", "evaluation"], "summary")).toBeNull();
    expect(chosenTab(["summary", "opportunity", "consensus"], "evaluation")).toBeNull();
    expect(chosenTab(["summary", "opportunity"], "proposals")).toBe("summary");
  });
});

describe("the evaluator's list (R-5.25, R-5.35)", () => {
  function listing(own: unknown[], onSubmit: () => Response = () => json(200, sprint())) {
    serve((method, path, body) => {
      if (path === `/api/opportunities/sprint-with-us/${ID}`) {
        if (method === "PUT" && (body as { tag?: string }).tag === "submitIndividualQuestionEvaluations") return onSubmit();
        return method === "GET" ? json(200, sprint()) : null;
      }
      if (method === "GET" && path === `/api/opportunity/sprint-with-us/${ID}/team-questions/evaluations`) return json(200, own);
      return null;
    });
    resetSessionForTests({ status: "signed-in", account: evaluator }, fakeIdentity());
    renderAt(`${MANAGE}?tab=evaluation`);
  }

  it("lists every proponent by anonymous name in order with the state of the evaluation, and offers no submission until all are complete", async () => {
    listing([evaluation(P1, "Proponent 1", "DRAFT", complete), evaluation(P2, "Proponent 2", "DRAFT", [complete[0]!])]);
    const rows = await screen.findAllByTestId("evaluation-proponent-row");
    expect(rows.map((row) => within(row).getByTestId("proposal-proponent-name").textContent)).toEqual(["Proponent 1", "Proponent 2", "Proponent 3"]);
    expect(rows.map((row) => within(row).getByTestId("evaluation-status").textContent)).toEqual(["Draft: complete", "Draft: incomplete", "Not started"]);
    const links = rows.map((row) => within(row).getByTestId("evaluation-open-proponent").getAttribute("href"));
    expect(links).toEqual([
      `/opportunities/sprint-with-us/${ID}/proposals/${P1}/team-questions/evaluations/${evaluator.id}/edit`,
      `/opportunities/sprint-with-us/${ID}/proposals/${P2}/team-questions/evaluations/${evaluator.id}/edit`,
      `/opportunities/sprint-with-us/${ID}/proposals/${P3}/team-questions/evaluations/create`,
    ]);
    expect((screen.getByTestId("evaluation-submit-for-consensus") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTestId("evaluation-individual-table")).toBeTruthy();
  });

  it("submits the whole set once every evaluation is complete, and says what the service refused", async () => {
    listing(
      [P1, P2, P3].map((id, index) => evaluation(id, `Proponent ${index + 1}`, "DRAFT", complete)),
      () => json(400, { errors: [INCOMPLETE_EVALUATION] }),
    );
    const submit = await screen.findByTestId("evaluation-submit-for-consensus");
    await waitFor(() => expect((submit as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(submit);
    expect((await screen.findByTestId("evaluation-incomplete-error")).textContent).toContain(INCOMPLETE_EVALUATION);
    expect(writes()).toEqual([{ method: "PUT", address: `/api/opportunities/sprint-with-us/${ID}`, body: { tag: "submitIndividualQuestionEvaluations" } }]);
  });

  it("shows each evaluation read-only once the set is submitted", async () => {
    listing([P1, P2, P3].map((id, index) => evaluation(id, `Proponent ${index + 1}`, "SUBMITTED", complete)));
    const rows = await screen.findAllByTestId("evaluation-proponent-row");
    expect(rows.map((row) => within(row).getByTestId("evaluation-status").textContent)).toEqual(["Submitted", "Submitted", "Submitted"]);
    expect(rows.map((row) => within(row).getByTestId("evaluation-open-proponent").textContent)).toEqual(["View evaluation", "View evaluation", "View evaluation"]);
    expect(screen.queryByTestId("evaluation-submit-for-consensus")).toBeNull();
  });
});

describe("one proponent's evaluation (R-5.3, R-5.21 to R-5.24, R-5.35)", () => {
  const CREATE = `/opportunities/sprint-with-us/${ID}/proposals/${P2}/team-questions/evaluations/create`;
  const EDIT = `/opportunities/sprint-with-us/${ID}/proposals/${P2}/team-questions/evaluations/${evaluator.id}/edit`;

  function scoring(own: unknown[], answers: { create?: () => Response; read?: () => Response; edit?: () => Response } = {}) {
    serve((method, path) => {
      if (method === "GET" && path === `/api/opportunities/sprint-with-us/${ID}`) return json(200, sprint());
      if (method === "GET" && path === `/api/opportunity/sprint-with-us/${ID}/team-questions/evaluations`) return json(200, own);
      if (path === `/api/proposal/sprint-with-us/${P2}/team-questions/evaluations` && method === "POST") return answers.create?.() ?? null;
      if (path === `/api/proposal/sprint-with-us/${P2}/team-questions/evaluations/${evaluator.id}`) {
        return method === "GET" ? (answers.read?.() ?? null) : (answers.edit?.() ?? null);
      }
      return null;
    });
    resetSessionForTests({ status: "signed-in", account: evaluator }, fakeIdentity());
  }

  const input = (testId: string, index: number) =>
    screen.getAllByTestId(testId)[index]!.querySelector("input, textarea") as HTMLInputElement | HTMLTextAreaElement;

  it("shows each question beside the proponent's answer, named only anonymously", async () => {
    scoring([]);
    renderAt(CREATE);
    expect((await screen.findByTestId("proposal-proponent-name")).textContent).toBe("Proponent 2");
    expect(screen.getAllByTestId("evaluation-question-response").map((block) => block.textContent)).toEqual([
      "Proponent 2's responseProponent 2's answer to question 1.",
      "Proponent 2's responseProponent 2's answer to question 2.",
    ]);
    expect(screen.getAllByTestId("evaluation-question-score-field")).toHaveLength(2);
    expect(screen.getAllByTestId("evaluation-question-notes-field")).toHaveLength(2);
    expect(screen.getByText("Proponent 2 of 3")).toBeTruthy();
  });

  it("keeps a draft as entered and moves on to the next proponent (R-5.23, R-5.35)", async () => {
    scoring([], { create: () => json(201, evaluation(P2, "Proponent 2", "DRAFT", [{ score: 6, notes: "" }])) });
    const router = renderAt(CREATE);
    await screen.findByTestId("proposal-proponent-name");
    fireEvent.change(input("evaluation-question-score-field", 0), { target: { value: "6" } });
    fireEvent.blur(input("evaluation-question-score-field", 0));
    fireEvent.click(screen.getByTestId("evaluation-save-next"));
    await waitFor(() => expect(writes()).toHaveLength(1));
    expect(writes()[0]).toEqual({
      method: "POST",
      address: `/api/proposal/sprint-with-us/${P2}/team-questions/evaluations`,
      body: {
        proposal: P2,
        status: "DRAFT",
        scores: [
          { order: 0, score: 6, notes: "" },
          { order: 1, score: null, notes: "" },
        ],
      },
    });
    await waitFor(() => expect(router.state.location.pathname).toBe(`/opportunities/sprint-with-us/${ID}/proposals/${P3}/team-questions/evaluations/create`));
  });

  it("says, in the service's words, that the person already holds an evaluation of this proponent (R-5.3)", async () => {
    scoring([], { create: () => json(409, { conflict: ["You already have a team question evaluation for this proposal."] }) });
    renderAt(CREATE);
    await screen.findByTestId("proposal-proponent-name");
    fireEvent.click(screen.getByTestId("evaluation-save-draft"));
    expect((await screen.findByTestId("evaluation-duplicate-error")).textContent).toContain("You already have a team question evaluation for this proposal.");
  });

  it("lists what stops a saved draft being submitted (R-5.22)", async () => {
    scoring([evaluation(P2, "Proponent 2", "DRAFT", [{ score: 6, notes: "Too high" }, { score: 2.125, notes: "" }])], {
      read: () => json(200, evaluation(P2, "Proponent 2", "DRAFT", [{ score: 6, notes: "Too high" }, { score: 2.125, notes: "" }])),
      edit: () => json(200, evaluation(P2, "Proponent 2", "DRAFT", [{ score: 6, notes: "Too high" }, { score: 2.125, notes: "" }])),
    });
    renderAt(EDIT);
    expect((await screen.findByTestId("evaluation-status")).textContent).toBe("Draft: incomplete");
    fireEvent.click(screen.getByTestId("evaluation-save-changes"));
    await waitFor(() => expect(screen.getAllByTestId("evaluation-score-error")).toHaveLength(2));
    expect(screen.getAllByTestId("evaluation-score-error").map((link) => link.textContent)).toEqual([
      "Question 1: enter a score between 0 and 5",
      "Question 2: enter a score with no more than two decimal places",
    ]);
    expect(screen.getByTestId("evaluation-notes-error").textContent).toBe("Question 2: enter a comment");
    expect(writes()[0]).toMatchObject({ method: "PUT", body: { tag: "edit" } });
  });

  it("shows a submitted evaluation without anything to change it (R-5.24)", async () => {
    scoring([evaluation(P2, "Proponent 2", "SUBMITTED", complete)], { read: () => json(200, evaluation(P2, "Proponent 2", "SUBMITTED", complete)) });
    renderAt(EDIT);
    expect(await screen.findByTestId("evaluation-read-only-notice")).toBeTruthy();
    expect(screen.getByTestId("evaluation-status").textContent).toBe("Submitted");
    expect(screen.queryByTestId("evaluation-question-score-field")).toBeNull();
    expect(screen.queryByTestId("evaluation-save-changes")).toBeNull();
    expect(screen.getByText("4 out of 5")).toBeTruthy();
  });

  it("shows the missing page to anyone who may not record an evaluation (R-5.21)", async () => {
    serve((method, path) => (method === "GET" && path === `/api/opportunities/sprint-with-us/${ID}` ? json(200, sprint()) : null));
    resetSessionForTests({ status: "signed-in", account: chair }, fakeIdentity());
    renderAt(CREATE);
    expect(await screen.findByTestId("not-found-page")).toBeTruthy();
  });

  it("shows the missing page for an evaluation the reader may not see (R-5.11)", async () => {
    scoring([], { read: () => json(404, { errors: ["There is no such evaluation."] }) });
    renderAt(EDIT);
    expect(await screen.findByTestId("not-found-page")).toBeTruthy();
  });
});
