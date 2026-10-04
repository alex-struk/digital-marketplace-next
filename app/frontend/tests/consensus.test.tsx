import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NOT_ALL_CONSENSUSES_SUBMITTED, noScreenableProponentRefusal } from "@rules/consensus";
import type { Account } from "../src/api/accounts";
import type { IdentityClient } from "../src/auth/identity-client";
import { resetSessionForTests } from "../src/auth/session";
import { routeTree } from "../src/router";

/**
 * The consensus, as the screens do it (decision record 0063): the Consensus tab
 * (evaluation-consensus-list-*), the finalise action in the manage page's action bar
 * (opportunity-*-edit), and one proponent's consensus (evaluation-consensus-create-*, -edit-*). The
 * service is stood in for; what is checked is what the screens offer, show and ask of it.
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
const chair = account({ id: "00000000-0000-4000-8000-000000000104", name: "Riley Placeholder" });
const owner = account({ id: "00000000-0000-4000-8000-000000000103", name: "Jordan Placeholder" });
const administrator = account({ id: "00000000-0000-4000-8000-000000000101", name: "Morgan Placeholder", type: "ADMIN" });

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
const MANAGE = `/opportunities/sprint-with-us/${ID}/edit`;
const CONSENSUS_OF = (proposal: string) => `/opportunities/sprint-with-us/${ID}/proposals/${proposal}/team-questions/consensus`;

const questions = [0, 1].map((order) => ({
  question: `Seeded team question ${order + 1}.`,
  guideline: "Answer in your own words.",
  score: 5,
  minimumScore: order === 1 ? 3 : null,
  wordLimit: 300,
  order,
}));

const proponents = [P1, P2].map((id, index) => ({
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
  createdBy: { id: owner.id, name: owner.name },
  updatedBy: { id: owner.id, name: owner.name },
  status: "EVAL_QUESTIONS_CONSENSUS",
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
    { user: { id: chair.id, name: chair.name }, evaluator: true, chair: true, order: 1 },
  ],
  proponents,
  subscribed: false,
  addenda: [],
  history: [],
  ...overrides,
});

const scoreSet = (proposal: string, name: string, member: { id: string; name: string }, status: "DRAFT" | "SUBMITTED", values: number[]) => ({
  proposal: { id: proposal, anonymousProponentName: name },
  evaluationPanelMember: { id: member.id, name: member.name },
  status,
  scores: values.map((score, order) => ({ order, score, notes: `${member.name} on question ${order + 1}.` })),
  createdAt: "2026-10-01T17:00:00.000Z",
  updatedAt: "2026-10-01T17:00:00.000Z",
});

const requests: { method: string; address: string; body: unknown }[] = [];

function serve(signedIn: Account, handler: (method: string, path: string, body: unknown) => Response | null) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: Request) => {
      const type = input.headers.get("content-type") ?? "";
      const body = type.includes("application/json") ? JSON.parse(await input.clone().text()) : undefined;
      const url = new URL(input.url);
      requests.push({ method: input.method, address: url.pathname, body });
      if (input.method === "GET" && url.pathname === "/api/sessions/current") return json(200, { id: "s", user: signedIn, panelCandidates: [] });
      return handler(input.method, url.pathname, body) ?? json(404, { errors: ["Not here."] });
    }),
  );
  resetSessionForTests({ status: "signed-in", account: signedIn }, fakeIdentity());
}

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function renderAt(address: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [address] }) });
  render(<RouterProvider router={router as never} />);
  return router;
}

const writes = () => requests.filter((request) => request.method !== "GET");
const LIST = `/api/opportunity/sprint-with-us/${ID}/team-questions/consensus`;
const OPPORTUNITY = `/api/opportunities/sprint-with-us/${ID}`;

beforeEach(() => {
  requests.length = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetSessionForTests();
});

describe("the chair's Consensus tab (R-5.13, R-5.29 to R-5.31)", () => {
  it("lists each proponent's consensus and holds back submitting until every one is complete", async () => {
    serve(chair, (method, path) => {
      if (method === "GET" && path === OPPORTUNITY) return json(200, sprint());
      if (method === "GET" && path === LIST) return json(200, [scoreSet(P1, "Proponent 1", chair, "DRAFT", [4, 4])]);
      return null;
    });
    renderAt(`${MANAGE}?tab=consensus`);
    const rows = await screen.findAllByTestId("evaluation-proponent-row");
    expect(rows.map((row) => within(row).getByTestId("evaluation-consensus-status").textContent)).toEqual(["Draft: complete", "Not started"]);
    const links = screen.getAllByTestId("evaluation-open-consensus");
    expect(links.map((link) => link.textContent)).toEqual(["Edit consensus", "Start consensus"]);
    expect(links[0]!.getAttribute("href")).toBe(`${CONSENSUS_OF(P1)}/${chair.id}/edit`);
    expect(links[1]!.getAttribute("href")).toBe(`${CONSENSUS_OF(P2)}/create`);
    expect(screen.getByTestId("evaluation-submit-consensus").hasAttribute("disabled") || screen.getByTestId("evaluation-submit-consensus").getAttribute("aria-disabled") === "true").toBe(true);
    // The chair is not offered finalising (R-5.14).
    expect(screen.queryByTestId("finalize-consensus-button")).toBeNull();
  });

  it("asks before submitting a complete set, and then submits it", async () => {
    serve(chair, (method, path) => {
      if (method === "GET" && path === OPPORTUNITY) return json(200, sprint());
      if (method === "GET" && path === LIST) {
        return json(200, [scoreSet(P1, "Proponent 1", chair, "DRAFT", [4, 4]), scoreSet(P2, "Proponent 2", chair, "SUBMITTED", [3, 3])]);
      }
      if (method === "PUT" && path === OPPORTUNITY) return json(200, sprint());
      return null;
    });
    renderAt(`${MANAGE}?tab=consensus`);
    const submit = await screen.findByTestId("evaluation-submit-consensus");
    await waitFor(() => expect(submit.hasAttribute("disabled")).toBe(false));
    fireEvent.click(submit);
    const dialog = await screen.findByTestId("evaluation-submit-consensus-dialog");
    expect(dialog.textContent).toContain("every administrator will be told");
    fireEvent.click(screen.getByTestId("evaluation-submit-consensus-confirm"));
    await waitFor(() => expect(writes()).toEqual([{ method: "PUT", address: OPPORTUNITY, body: { tag: "submitConsensusQuestionEvaluations" } }]));
    expect(await screen.findByText("The consensus scores have been submitted")).toBeTruthy();
  });
});

describe("the owner and administrators at consensus (R-5.12, R-5.14, R-1.41, R-5.10)", () => {
  it("tells the owner off the panel why the agreed scores are not shown, and still offers finalising", async () => {
    serve(owner, (method, path) => (method === "GET" && path === OPPORTUNITY ? json(200, sprint({ proponents: undefined })) : null));
    renderAt(`${MANAGE}?tab=consensus`);
    const withheld = await screen.findByTestId("evaluation-consensus-withheld-message");
    expect(withheld.textContent).toContain("you are not on this opportunity's panel");
    expect(withheld.textContent).toContain("code challenge");
    expect(screen.queryByTestId("evaluation-proponent-row")).toBeNull();
    expect(screen.getByTestId("finalize-consensus-button")).toBeTruthy();
    expect(requests.some((request) => request.address === LIST)).toBe(false);
  });

  it("names why finalising was refused, and which refusal it is", async () => {
    let refusal = NOT_ALL_CONSENSUSES_SUBMITTED;
    serve(administrator, (method, path) => {
      if (method === "GET" && path === OPPORTUNITY) return json(200, sprint());
      if (method === "GET" && path === LIST) return json(200, []);
      if (method === "PUT" && path === OPPORTUNITY) return json(400, { errors: [refusal] });
      return null;
    });
    renderAt(MANAGE);
    fireEvent.click(await screen.findByTestId("finalize-consensus-button"));
    expect((await screen.findByTestId("evaluation-finalize-dialog")).textContent).toContain("Up to four");
    fireEvent.click(screen.getByTestId("evaluation-finalize-confirm"));
    const refused = await screen.findByTestId("advance-refused-message");
    expect(within(refused).getByTestId("evaluation-not-all-submitted-error").textContent).toContain(NOT_ALL_CONSENSUSES_SUBMITTED);
    expect(writes()[0]).toEqual({ method: "PUT", address: OPPORTUNITY, body: { tag: "finalizeQuestionConsensuses" } });

    refusal = noScreenableProponentRefusal("sprint-with-us");
    fireEvent.click(screen.getByTestId("finalize-consensus-button"));
    fireEvent.click(await screen.findByTestId("evaluation-finalize-confirm"));
    await waitFor(() => expect(screen.getByTestId("evaluation-no-screenable-error").textContent).toContain("screened into the Code Challenge"));
  });

  it("moves on once finalised, and offers finalising no more", async () => {
    serve(owner, (method, path) => {
      if (method === "GET" && path === OPPORTUNITY) return json(200, sprint({ proponents: undefined }));
      if (method === "PUT" && path === OPPORTUNITY) return json(200, sprint({ status: "EVAL_CC", proponents: undefined }));
      return null;
    });
    renderAt(MANAGE);
    fireEvent.click(await screen.findByTestId("finalize-consensus-button"));
    fireEvent.click(await screen.findByTestId("evaluation-finalize-confirm"));
    await waitFor(() => expect(screen.queryByTestId("finalize-consensus-button")).toBeNull());
    expect(screen.getByTestId("opportunity-status").textContent).toContain("Code challenge");
  });
});

describe("one proponent's consensus (R-5.28, R-5.29, R-5.30)", () => {
  const panelScores = [scoreSet(P1, "Proponent 1", evaluator, "SUBMITTED", [4, 3.5]), scoreSet(P1, "Proponent 1", chair, "SUBMITTED", [5, 4])];

  it("gives the chair the form, with every evaluator's scores beside their names, and saves a draft", async () => {
    serve(chair, (method, path) => {
      if (method === "GET" && path === OPPORTUNITY) return json(200, sprint());
      if (method === "GET" && path === `/api/proposal/sprint-with-us/${P1}/team-questions/evaluations`) return json(200, panelScores);
      if (method === "GET" && path === LIST) return json(200, []);
      if (method === "POST" && path === `/api/proposal/sprint-with-us/${P1}/team-questions/consensus`) {
        return json(201, scoreSet(P1, "Proponent 1", chair, "DRAFT", [4, 4]));
      }
      return null;
    });
    renderAt(`${CONSENSUS_OF(P1)}/create`);
    expect((await screen.findByTestId("proposal-proponent-name")).textContent).toBe("Proponent 1");
    const scores = await screen.findAllByTestId("evaluation-panel-member-score");
    expect(scores.map((cell) => cell.textContent)).toEqual(["4 out of 5", "5 out of 5", "3.5 out of 5", "4 out of 5"]);
    expect(screen.getAllByTestId("evaluation-panel-member-notes")[0]!.textContent).toBe("Casey Placeholder on question 1.");
    expect(screen.getAllByTestId("evaluation-question-score-field")).toHaveLength(2);
    fireEvent.click(screen.getByTestId("evaluation-save-draft"));
    await waitFor(() => expect(writes()[0]).toMatchObject({ method: "POST", address: `/api/proposal/sprint-with-us/${P1}/team-questions/consensus` }));
  });

  it("names a second consensus for the same proponent as a duplicate (R-5.29)", async () => {
    serve(chair, (method, path) => {
      if (method === "GET" && path === OPPORTUNITY) return json(200, sprint());
      if (method === "GET" && path === `/api/proposal/sprint-with-us/${P1}/team-questions/evaluations`) return json(200, panelScores);
      if (method === "GET" && path === LIST) return json(200, [scoreSet(P1, "Proponent 1", chair, "DRAFT", [4, 4])]);
      if (method === "POST") return json(409, { conflict: ["You already have a team question consensus for this proposal."] });
      return null;
    });
    renderAt(`${CONSENSUS_OF(P1)}/create`);
    fireEvent.click(await screen.findByTestId("evaluation-save-draft"));
    expect((await screen.findByTestId("evaluation-duplicate-consensus-error")).textContent).toContain("You already have a team question consensus");
    expect(screen.getByText("Go to the consensus for Proponent 1").getAttribute("href")).toBe(`${CONSENSUS_OF(P1)}/${chair.id}/edit`);
  });

  it("shows a panel member who is not the chair the evaluators' scores and says only the chair records", async () => {
    serve(evaluator, (method, path) => {
      if (method === "GET" && path === OPPORTUNITY) return json(200, sprint());
      if (method === "GET" && path === `/api/proposal/sprint-with-us/${P1}/team-questions/evaluations`) return json(200, panelScores);
      if (method === "GET" && path === LIST) return json(200, []);
      return null;
    });
    renderAt(`${CONSENSUS_OF(P1)}/create`);
    expect(await screen.findByTestId("evaluation-chair-only-message")).toBeTruthy();
    expect(screen.getAllByTestId("evaluation-panel-member-score")).toHaveLength(4);
    expect(screen.queryByTestId("evaluation-question-score-field")).toBeNull();
  });

  it("shows the missing page before the consensus stage, even to the panel (R-5.28)", async () => {
    serve(evaluator, (method, path) => (method === "GET" && path === OPPORTUNITY ? json(200, sprint({ status: "EVAL_QUESTIONS_INDIVIDUAL" })) : null));
    renderAt(`${CONSENSUS_OF(P1)}/create`);
    expect(await screen.findByTestId("not-found-page")).toBeTruthy();
    expect(requests.some((request) => request.address.endsWith("/team-questions/evaluations"))).toBe(false);
  });

  it("keeps a submitted consensus open to the chair, saying it can still change (R-5.30)", async () => {
    serve(chair, (method, path) => {
      if (method === "GET" && path === OPPORTUNITY) return json(200, sprint());
      if (method === "GET" && path === `/api/proposal/sprint-with-us/${P1}/team-questions/evaluations`) return json(200, panelScores);
      if (method === "GET" && path === LIST) return json(200, [scoreSet(P1, "Proponent 1", chair, "SUBMITTED", [4, 4])]);
      if (method === "GET" && path === `/api/proposal/sprint-with-us/${P1}/team-questions/consensus/${chair.id}`) {
        return json(200, scoreSet(P1, "Proponent 1", chair, "SUBMITTED", [4, 4]));
      }
      if (method === "PUT") return json(200, scoreSet(P1, "Proponent 1", chair, "SUBMITTED", [4, 4]));
      return null;
    });
    renderAt(`${CONSENSUS_OF(P1)}/${chair.id}/edit`);
    expect(await screen.findByTestId("evaluation-editable-notice")).toBeTruthy();
    expect(screen.getByTestId("evaluation-consensus-status").textContent).toBe("Submitted");
    fireEvent.click(screen.getByTestId("evaluation-save-changes"));
    await waitFor(() => expect(writes()[0]).toMatchObject({ method: "PUT", body: { tag: "edit" } }));
  });
});
