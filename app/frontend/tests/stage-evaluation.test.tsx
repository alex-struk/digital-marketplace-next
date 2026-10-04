import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ALL_MUST_BE_SCORED, WRONG_STAGE } from "@rules/team-evaluation";
import type { Account } from "../src/api/accounts";
import type { IdentityClient } from "../src/auth/identity-client";
import { resetSessionForTests } from "../src/auth/session";
import { routeTree } from "../src/router";
import { inStage, stageTabWords } from "../src/screens/opportunity-stage-tab";
import { ordinal, stageTabSentence } from "../src/screens/proposal-team-view";

/**
 * The stages after the questions as the screens show them (decision record 0065): each stage's tab on
 * the read-only proposal page, offering its score only once the opportunity stands at the stage and
 * the proposal is in it (R-2.28); screening in to the team scenario; the price score and rank
 * (R-2.30, R-2.31); and the manage page's Start team scenario with its refusal (R-1.42), and its
 * stage tabs. The service is stood in for.
 */

const staff: Account = {
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
};

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

const OPPORTUNITY = "00000000-0000-4000-a030-000000000001";
const PROPOSAL = "00000000-0000-4000-a030-000000000101";

const opportunity = (program: "sprint-with-us" | "team-with-us", status: string) => ({
  id: OPPORTUNITY,
  program,
  createdAt: "2026-08-01T17:00:00.000Z",
  updatedAt: "2026-08-01T17:00:00.000Z",
  createdBy: { id: staff.id, name: staff.name },
  updatedBy: { id: staff.id, name: staff.name },
  status,
  publishedAt: "2026-08-02T17:00:00.000Z",
  title: "Seeded opportunity",
  teaser: "",
  location: "Victoria",
  remoteOk: true,
  remoteDesc: "",
  description: "",
  proposalDeadline: "2026-09-04",
  assignmentDate: "2026-09-14",
  ...(program === "sprint-with-us"
    ? { totalMaxBudget: 500_000, teamQuestions: [{ question: "Why you?", guideline: "", score: 5, minimumScore: null, wordLimit: 300, order: 0 }] }
    : { maxBudget: 500_000, resources: [], resourceQuestions: [{ question: "How?", guideline: "", score: 5, minimumScore: null, wordLimit: 300, order: 0 }] }),
  subscribed: false,
  attachments: [],
  addenda: [],
  history: [],
});

const proposal = (program: "sprint-with-us" | "team-with-us", status: string, opportunityStatus: string, scoresheet: Record<string, unknown> = {}) => ({
  id: PROPOSAL,
  program,
  createdAt: "2026-08-10T17:00:00.000Z",
  updatedAt: "2026-08-10T17:00:00.000Z",
  createdBy: { id: "vendor", name: "Blake Placeholder" },
  updatedBy: { id: "vendor", name: "Blake Placeholder" },
  status,
  submittedAt: "2026-08-10T17:00:00.000Z",
  opportunity: { id: OPPORTUNITY, title: "Seeded opportunity", status: opportunityStatus, proposalDeadline: "2026-09-04", totalMaxBudget: 500_000, maxBudget: 500_000 },
  organization: { id: "org", legalName: "Northern Pines Digital Ltd." },
  totalProposedCost: 100_000,
  teamQuestionResponses: [{ order: 0, response: "We fit." }],
  resourceQuestionResponses: [{ order: 0, response: "Carefully." }],
  references: [],
  team: [],
  attachments: [],
  anonymousProponentName: "Proponent 1",
  scoresheet: { questions: 80, challenge: null, scenario: null, price: null, total: null, rank: null, ...scoresheet },
  history: [] as unknown[],
});

const requests: { method: string; path: string; body: unknown }[] = [];

function serve(handler: (method: string, path: string, body: unknown) => Response) {
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

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function renderAt(address: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [address] }) });
  return render(<RouterProvider router={router as never} />);
}

const writes = () => requests.filter((request) => request.method !== "GET");
const field = (testId: string) => screen.getByTestId(testId).querySelector("input") as HTMLInputElement;

/** The service, answering one proposal and its opportunity, and a change with what `onChange` says. */
function answering(program: "sprint-with-us" | "team-with-us", start: ReturnType<typeof proposal>, onChange: (body: unknown) => Response = () => json(500, {})) {
  serve((method, path, body) => {
    if (path === `/api/proposals/${program}/${PROPOSAL}`) return method === "PUT" ? onChange(body) : json(200, start);
    if (path === `/api/opportunities/${program}/${OPPORTUNITY}`) return json(200, opportunity(program, start.opportunity.status));
    return json(200, []);
  });
  resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
}

const VIEW = (program: string, tab: string) => `/opportunities/${program}/${OPPORTUNITY}/proposals/${PROPOSAL}?tab=${tab}`;

beforeEach(() => {
  requests.length = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetSessionForTests();
});

describe("a stage's score on the proposal page (R-2.28)", () => {
  it("offers the code challenge score at the code challenge, and records what is entered", async () => {
    answering("sprint-with-us", proposal("sprint-with-us", "UNDER_REVIEW_CODE_CHALLENGE", "EVAL_CC"), () =>
      json(200, proposal("sprint-with-us", "EVALUATED_CODE_CHALLENGE", "EVAL_CC", { challenge: 72.5 })),
    );
    renderAt(VIEW("sprint-with-us", "codeChallenge"));
    fireEvent.click(await screen.findByTestId("proposal-score-code-challenge"));
    const dialog = await screen.findByTestId("proposal-score-dialog");
    expect(within(dialog).getByText("Enter code challenge score")).toBeTruthy();
    fireEvent.change(field("proposal-score-field"), { target: { value: "72.5" } });
    fireEvent.click(screen.getByTestId("proposal-score-confirm"));
    await waitFor(() => expect(screen.getByTestId("proposal-challenge-score").textContent).toBe("72.5%"));
    expect(writes().map((request) => request.body)).toEqual([{ tag: "scoreCodeChallenge", value: 72.5 }]);
  });

  it("offers no team scenario score before the opportunity reaches it, and says when it can be scored", async () => {
    answering("sprint-with-us", proposal("sprint-with-us", "UNDER_REVIEW_TEAM_SCENARIO", "EVAL_CC", { challenge: 80 }));
    renderAt(VIEW("sprint-with-us", "teamScenario"));
    expect(await screen.findByText(/can be scored once the opportunity has reached the team scenario/)).toBeTruthy();
    expect(screen.queryByTestId("proposal-score-team-scenario")).toBeNull();
  });

  it("offers no code challenge score to a proposal carried past it, but offers to screen it out", async () => {
    answering("sprint-with-us", proposal("sprint-with-us", "UNDER_REVIEW_TEAM_SCENARIO", "EVAL_CC", { challenge: 80 }));
    renderAt(VIEW("sprint-with-us", "codeChallenge"));
    expect(await screen.findByTestId("proposal-screen-out")).toBeTruthy();
    expect(screen.queryByTestId("proposal-score-code-challenge")).toBeNull();
  });

  it("screens a scored proponent in to the team scenario", async () => {
    answering("sprint-with-us", proposal("sprint-with-us", "EVALUATED_CODE_CHALLENGE", "EVAL_CC", { challenge: 80 }), () =>
      json(200, proposal("sprint-with-us", "UNDER_REVIEW_TEAM_SCENARIO", "EVAL_CC", { challenge: 80 })),
    );
    renderAt(VIEW("sprint-with-us", "codeChallenge"));
    fireEvent.click(await screen.findByTestId("proposal-screen-in"));
    await waitFor(() => expect(screen.getByTestId("proposal-status").textContent).toBe("Under review: team scenario"));
    expect(writes().map((request) => request.body)).toEqual([{ tag: "screenInToTeamScenario" }]);
  });

  it("says so above the tab when the service refuses a score at the wrong stage", async () => {
    answering("sprint-with-us", proposal("sprint-with-us", "UNDER_REVIEW_TEAM_SCENARIO", "EVAL_SCENARIO", { challenge: 80 }), () => json(400, { errors: [WRONG_STAGE] }));
    renderAt(VIEW("sprint-with-us", "teamScenario"));
    fireEvent.click(await screen.findByTestId("proposal-score-team-scenario"));
    await screen.findByTestId("proposal-score-dialog");
    fireEvent.change(field("proposal-score-field"), { target: { value: "60" } });
    fireEvent.click(screen.getByTestId("proposal-score-confirm"));
    expect((await screen.findByTestId("proposal-wrong-stage-error")).textContent).toContain(WRONG_STAGE);
  });

  it("offers a Team With Us challenge score only at the challenge", async () => {
    answering("team-with-us", proposal("team-with-us", "UNDER_REVIEW_CHALLENGE", "EVAL_QUESTIONS_CONSENSUS"));
    const early = renderAt(VIEW("team-with-us", "challenge"));
    expect(await screen.findByText(/can be scored once the opportunity has reached the challenge/)).toBeTruthy();
    expect(screen.queryByTestId("proposal-score-challenge")).toBeNull();
    early.unmount();

    answering("team-with-us", proposal("team-with-us", "UNDER_REVIEW_CHALLENGE", "EVAL_C"));
    renderAt(VIEW("team-with-us", "challenge"));
    expect(await screen.findByTestId("proposal-score-challenge")).toBeTruthy();
    expect(screen.getByTestId("proposal-tab-resource-questions")).toBeTruthy();
  });
});

describe("the price score and rank (R-2.30, R-2.31)", () => {
  it("shows the price, the total and the place among the fully evaluated", async () => {
    answering(
      "sprint-with-us",
      proposal("sprint-with-us", "EVALUATED_TEAM_SCENARIO", "PROCESSING", { challenge: 75, scenario: 60, price: 50, total: 69, rank: { rank: 2, of: 2 } }),
    );
    renderAt(VIEW("sprint-with-us", "proposal"));
    expect((await screen.findByTestId("proposal-price-score")).textContent).toBe("50%");
    expect(screen.getByTestId("proposal-total-score").textContent).toBe("69%");
    expect(screen.getByTestId("proposal-rank").textContent).toBe("2nd");
  });

  it("names places as ordinals", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 103].map(ordinal)).toEqual(["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "103rd"]);
  });

  it("puts every stage score and the calculated price on the history (R-2.35)", async () => {
    const start = {
      ...proposal("sprint-with-us", "EVALUATED_TEAM_SCENARIO", "PROCESSING"),
      history: [
        { createdAt: "2026-09-20T17:00:00.001Z", createdBy: null, status: null, event: "PRICE_SCORE_ENTERED", note: 'A price score of "50%" was calculated.' },
        { createdAt: "2026-09-20T17:00:00.000Z", createdBy: { id: staff.id, name: staff.name }, status: null, event: "SCENARIO_SCORE_ENTERED", note: 'A team scenario score of "60%" was entered.' },
      ],
    };
    answering("sprint-with-us", start);
    renderAt(VIEW("sprint-with-us", "history"));
    const table = await screen.findByTestId("proposal-history-table");
    expect(within(table).getByText("Price score calculated: 50%")).toBeTruthy();
    expect(within(table).getByText("Team scenario score entered: 60%")).toBeTruthy();
    expect(within(table).getByText("System")).toBeTruthy();
  });
});

describe("the stage tab's words", () => {
  it("says when the proposal can be scored", () => {
    expect(stageTabSentence("sprint-with-us", "scoreTeamScenario", "UNDER_REVIEW_TEAM_SCENARIO", "EVAL_CC", false)).toBe(
      "This opportunity is at the code challenge stage. This proposal can be scored once the opportunity has reached the team scenario.",
    );
    expect(stageTabSentence("team-with-us", "scoreChallenge", "UNDER_REVIEW_QUESTIONS", "EVAL_C", false)).toContain("not carried into the challenge");
  });

  it("lists on the manage page's tab only those who reached the stage", () => {
    const listed = [
      { status: "UNDER_REVIEW_QUESTIONS", scoresheet: undefined },
      { status: "EVALUATED_CODE_CHALLENGE", scoresheet: undefined },
      { status: "DISQUALIFIED", scoresheet: { questions: 80, challenge: 70, scenario: null, price: null, total: null, rank: null } },
    ] as never[];
    expect(inStage("codeChallenge", listed)).toHaveLength(2);
    expect(inStage("teamScenario", listed)).toHaveLength(0);
    expect(stageTabWords("teamScenario", "EVAL_CC")).toContain("has not reached the team scenario");
  });
});

describe("the manage page at the code challenge and in processing (R-1.42, R-1.49)", () => {
  function managing(program: "sprint-with-us" | "team-with-us", status: string, onChange: (body: unknown) => Response = () => json(500, {})) {
    serve((method, path, body) => {
      if (path === `/api/opportunities/${program}/${OPPORTUNITY}`) return method === "PUT" ? onChange(body) : json(200, opportunity(program, status));
      return json(200, []);
    });
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
  }

  it("offers its owner Start team scenario, and says why it was refused", async () => {
    managing("sprint-with-us", "EVAL_CC", () => json(400, { errors: [ALL_MUST_BE_SCORED] }));
    renderAt(`/opportunities/sprint-with-us/${OPPORTUNITY}/edit`);
    expect(await screen.findByTestId("opportunity-tab-code-challenge")).toBeTruthy();
    expect(screen.getByTestId("opportunity-tab-team-scenario")).toBeTruthy();
    fireEvent.click(screen.getByTestId("start-team-scenario-button"));
    expect((await screen.findByTestId("advance-refused-message")).textContent).toContain("All proponents must be scored first.");
    expect(writes().map((request) => request.body)).toEqual([{ tag: "startTeamScenario" }]);
  });

  it("starts the team scenario when the service agrees", async () => {
    managing("sprint-with-us", "EVAL_CC", () => json(200, opportunity("sprint-with-us", "EVAL_SCENARIO")));
    renderAt(`/opportunities/sprint-with-us/${OPPORTUNITY}/edit`);
    fireEvent.click(await screen.findByTestId("start-team-scenario-button"));
    await waitFor(() => expect(screen.getByTestId("opportunity-status").textContent).toBe("Team scenario"));
    expect(screen.queryByTestId("start-team-scenario-button")).toBeNull();
  });

  it("offers its owner the award on a Team With Us opportunity in processing", async () => {
    managing("team-with-us", "PROCESSING");
    renderAt(`/opportunities/team-with-us/${OPPORTUNITY}/edit`);
    expect(await screen.findByTestId("opportunity-award-button")).toBeTruthy();
    expect(screen.getByTestId("opportunity-tab-challenge")).toBeTruthy();
    expect(screen.queryByTestId("opportunity-tab-code-challenge")).toBeNull();
  });
});
