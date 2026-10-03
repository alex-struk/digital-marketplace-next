import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Account } from "../src/api/accounts";
import type { IdentityClient } from "../src/auth/identity-client";
import { resetSessionForTests } from "../src/auth/session";
import { routeTree } from "../src/router";
import { panelEntriesOf, panelFormProblems, panelRefusalProblems } from "../src/screens/evaluation-panel-tab";

/**
 * Sprint With Us and Team With Us opportunities once they exist (decision record 0045): the manage
 * page and its Evaluation panel tab (opportunity-swu-edit, evaluation-panel-swu, -twu) and the
 * public views with the page each embeds (opportunity-swu-view, opportunity-twu-view). The service
 * is stood in for; what is checked is what the screens show and what they ask of it.
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

const staff = account({});
const other = { id: "00000000-0000-4000-8000-000000000103", name: "Jordan Placeholder" };
const third = { id: "00000000-0000-4000-8000-000000000104", name: "Riley Placeholder" };
const vendor = account({
  id: "00000000-0000-4000-8000-000000000201",
  type: "VENDOR",
  name: "Alex Placeholder",
  acceptedTermsAt: "2026-01-05T17:00:00.000Z",
  lastAcceptedTermsAt: "2026-01-05T17:00:00.000Z",
});

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

const ID = "00000000-0000-4000-8000-000000000911";

const sprint = (overrides: Record<string, unknown> = {}) => ({
  id: ID,
  program: "sprint-with-us",
  createdAt: "2026-10-01T17:00:00.000Z",
  updatedAt: "2026-10-01T17:00:00.000Z",
  createdBy: { id: staff.id, name: staff.name },
  updatedBy: { id: staff.id, name: staff.name },
  status: "PUBLISHED",
  publishedAt: "2026-10-01T18:00:00.000Z",
  title: "Modernize the licence renewal service",
  teaser: "Rebuild licence renewals.",
  location: "Victoria",
  remoteOk: false,
  remoteDesc: "",
  description: "Licence holders renew on paper today.",
  proposalDeadline: "2030-10-16",
  assignmentDate: "2030-10-23",
  totalMaxBudget: 1_200_000,
  mandatorySkills: ["React"],
  inceptionPhase: null,
  prototypePhase: { phase: "PROTOTYPE", startDate: "2030-11-02", completionDate: "2031-01-29", maxBudget: 0 },
  implementationPhase: { phase: "IMPLEMENTATION", startDate: "2031-02-01", completionDate: "2031-09-30", maxBudget: 1_200_000 },
  teamQuestions: [{ question: "Why you?", guideline: "Fit.", score: 5, minimumScore: null, wordLimit: 300, order: 0 }],
  questionsWeight: 25,
  codeChallengeWeight: 25,
  scenarioWeight: 25,
  priceWeight: 25,
  evaluationPanel: [
    { user: { id: staff.id, name: staff.name }, evaluator: true, chair: true, order: 0 },
    { user: other, evaluator: true, chair: false, order: 1 },
  ],
  subscribed: false,
  addenda: [],
  history: [],
  ...overrides,
});

const team = (overrides: Record<string, unknown> = {}) => ({
  ...sprint(),
  program: "team-with-us",
  title: "Data platform team",
  totalMaxBudget: undefined,
  maxBudget: 900_000,
  startDate: "2030-11-02",
  completionDate: "2031-10-29",
  resources: [{ serviceArea: "DATA_PROFESSIONAL", targetAllocation: 50, order: 0 }],
  resourceQuestions: [],
  challengeWeight: 50,
  ...overrides,
});

const requests: { method: string; address: string; body: unknown }[] = [];

function serve(handler: (method: string, path: string, body: unknown) => Response | null) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: Request) => {
      const type = input.headers.get("content-type") ?? "";
      const body = type.includes("application/json") ? JSON.parse(await input.clone().text()) : undefined;
      const url = new URL(input.url);
      requests.push({ method: input.method, address: url.pathname, body });
      if (input.method === "GET" && url.pathname === "/api/sessions/current") {
        return json(200, { id: "s", user: staff, panelCandidates: [{ id: staff.id, name: staff.name }, other, third] });
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

beforeEach(() => {
  requests.length = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetSessionForTests();
});

describe("the evaluation panel tab (R-5.1, R-5.9, R-5.16, R-5.18, R-5.37)", () => {
  const panelAddress = `/opportunities/sprint-with-us/${ID}/edit?tab=evaluationPanel`;

  it("lists each evaluator with the chair ticked and chosen, and saves the panel as it stands", async () => {
    serve((method, path) => {
      if (path !== `/api/opportunities/sprint-with-us/${ID}`) return null;
      return method === "GET" || method === "PUT" ? json(200, sprint()) : null;
    });
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt(panelAddress);
    const rows = await screen.findAllByTestId("evaluation-panel-member-row");
    expect(rows).toHaveLength(2);
    expect(screen.getByTestId("opportunity-tab-evaluation-panel").getAttribute("aria-current")).toBe("page");
    expect(screen.getByTestId("evaluation-panel-chair-field")).toBeTruthy();
    const chairs = screen.getAllByTestId("evaluation-panel-member-chair").map((box) => (box.querySelector("input") as HTMLInputElement).checked);
    expect(chairs).toEqual([true, false]);
    fireEvent.click(screen.getByTestId("evaluation-panel-save"));
    await waitFor(() => expect(requests.some((request) => request.method === "PUT")).toBe(true));
    expect(requests.find((request) => request.method === "PUT")?.body).toEqual({
      tag: "editEvaluationPanel",
      value: [
        { user: staff.id, evaluator: true, chair: true },
        { user: other.id, evaluator: true, chair: false },
      ],
    });
    expect(await screen.findByText("The evaluation panel has been saved.")).toBeTruthy();
  });

  it("refuses a panel of one before sending it, and keeps the panel it had", async () => {
    serve((method, path) => (method === "GET" && path === `/api/opportunities/sprint-with-us/${ID}` ? json(200, sprint()) : null));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt(panelAddress);
    await screen.findAllByTestId("evaluation-panel-member-row");
    fireEvent.click(screen.getAllByTestId("evaluation-panel-remove-member")[1] as HTMLElement);
    fireEvent.click(screen.getByTestId("evaluation-panel-save"));
    expect((await screen.findByTestId("evaluation-panel-minimum-error")).textContent).toBe("Evaluation panel: name at least two members");
    expect(screen.getByText("The panel was not saved. It is still the panel it was before.")).toBeTruthy();
    expect(requests.some((request) => request.method === "PUT")).toBe(false);
  });

  it("shows the service's refusal of a member at their own row, naming them", async () => {
    serve((method, path) => {
      if (path !== `/api/opportunities/sprint-with-us/${ID}`) return null;
      if (method === "GET") return json(200, sprint());
      return json(400, { errors: ["evaluationPanel: Panel member 2: Jordan Placeholder is not a public sector employee."] });
    });
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt(panelAddress);
    await screen.findAllByTestId("evaluation-panel-member-row");
    fireEvent.click(screen.getByTestId("evaluation-panel-save"));
    expect((await screen.findByTestId("evaluation-panel-not-public-sector-error")).textContent).toBe(
      "Evaluator 2: Jordan Placeholder is not a public sector employee",
    );
  });

  it("lists the panel, fixed, from the consensus stage", async () => {
    serve((method, path) =>
      method === "GET" && path === `/api/opportunities/sprint-with-us/${ID}` ? json(200, sprint({ status: "EVAL_QUESTIONS_CONSENSUS" })) : null,
    );
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt(panelAddress);
    expect(await screen.findByTestId("evaluation-panel-locked-message")).toBeTruthy();
    // The tab is a surface of its own, and the document title is its surface title.
    expect(document.title).toBe("Evaluation Panel");
    // The state as Sprint With Us names it.
    expect(screen.getByTestId("opportunity-status").textContent).toBe("Team questions: consensus");
    expect(screen.getAllByTestId("evaluation-panel-member-row").map((row) => row.textContent)).toEqual([
      "Casey PlaceholderEvaluator and chair",
      "Jordan PlaceholderEvaluator",
    ]);
    expect(screen.queryByTestId("evaluation-panel-save")).toBeNull();
  });

  it("is the missing page to anybody but the author and administrators (R-5.18)", async () => {
    serve((method, path) =>
      method === "GET" && path === `/api/opportunities/sprint-with-us/${ID}`
        ? json(200, sprint({ createdBy: undefined, updatedBy: undefined, evaluationPanel: undefined }))
        : null,
    );
    resetSessionForTests({ status: "signed-in", account: account({ id: other.id, name: other.name }) }, fakeIdentity());
    renderAt(panelAddress);
    expect(await screen.findByRole("heading", { level: 1, name: /not found/i })).toBeTruthy();
    expect(screen.queryByTestId("evaluation-panel-save")).toBeNull();
  });

  it("has no accessibility violations", async () => {
    serve((method, path) => (method === "GET" && path === `/api/opportunities/sprint-with-us/${ID}` ? json(200, sprint()) : null));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt(panelAddress);
    await screen.findAllByTestId("evaluation-panel-member-row");
    const results = await axe.run(document.body, { rules: { region: { enabled: false } } });
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  });
});

describe("the panel form's own rules", () => {
  const nameOf = (id: string) => ({ a: "Ann", b: "Bo" })[id] ?? "This person";

  it("sends a chair who does not evaluate after the evaluators", () => {
    expect(panelEntriesOf(["a"], "b")).toEqual([
      { user: "a", evaluator: true, chair: false },
      { user: "b", evaluator: false, chair: true },
    ]);
    expect(panelEntriesOf(["a", "b"], "a")).toEqual([
      { user: "a", evaluator: true, chair: true },
      { user: "b", evaluator: true, chair: false },
    ]);
  });

  it("checks, in order, at least two members, nobody twice, and a chair", () => {
    expect(panelFormProblems(["a"], "", nameOf).map((problem) => problem.testId)).toEqual([
      "evaluation-panel-minimum-error",
      "evaluation-panel-missing-chair-error",
    ]);
    expect(panelFormProblems(["a", "a"], "a", nameOf).map((problem) => problem.text)).toEqual(["Evaluator 2: Ann is already on the panel"]);
    expect(panelFormProblems(["a"], "b", nameOf)).toEqual([]);
  });

  it("places the service's refusals where the form shows them", () => {
    const placed = panelRefusalProblems(
      [
        "evaluationPanel: Choose a chair. The panel needs one person to record the agreed scores.",
        "evaluationPanel: Panel member 3: Bo must be an evaluator, the chair, or both.",
        "The evaluation panel can no longer be changed.",
      ],
      2,
    );
    expect(placed.problems.map((problem) => [problem.at, problem.testId])).toEqual([
      ["chair", "evaluation-panel-missing-chair-error"],
      ["chair", undefined],
    ]);
    expect(placed.rest).toEqual(["The evaluation panel can no longer be changed."]);
  });
});

describe("the manage page (R-1.21, R-1.53, R-1.56)", () => {
  it("offers a draft's author Edit, Submit for review and Delete, and says an incomplete draft is incomplete", async () => {
    serve((method, path) => {
      if (path !== `/api/opportunities/sprint-with-us/${ID}`) return null;
      if (method === "GET") return json(200, sprint({ status: "DRAFT", publishedAt: null }));
      return json(400, { errors: ["This opportunity is incomplete. Please edit the opportunity, complete and save the form, and then submit it again."] });
    });
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt(`/opportunities/sprint-with-us/${ID}/edit`);
    expect(await screen.findByTestId("opportunity-edit-button")).toBeTruthy();
    expect(screen.getByTestId("opportunity-delete-button")).toBeTruthy();
    expect(screen.queryByTestId("opportunity-publish")).toBeNull();
    expect(screen.queryByTestId("opportunity-tab-addenda")).toBeNull();
    expect(screen.getByTestId("opportunity-tab-evaluation-panel")).toBeTruthy();
    fireEvent.click(screen.getByTestId("opportunity-submit-for-review"));
    expect(await screen.findByTestId("opportunity-incomplete-message")).toBeTruthy();
    expect(requests.find((request) => request.method === "PUT")?.body).toEqual({ tag: "submitForReview" });
  });

  it("offers an administrator Delete on a Sprint With Us draft, and deleting it takes it out of their list", async () => {
    const administrator = account({ id: "00000000-0000-4000-8000-000000000101", type: "ADMIN", name: "Robin Placeholder" });
    // A draft an administrator saved with little in it: no phases, budget or questions yet.
    const draft = sprint({
      status: "DRAFT",
      publishedAt: null,
      title: "An administrator's sprint draft",
      createdBy: { id: administrator.id, name: administrator.name },
      updatedBy: { id: administrator.id, name: administrator.name },
      totalMaxBudget: 0,
      mandatorySkills: [],
      prototypePhase: null,
      implementationPhase: null,
      teamQuestions: [],
      evaluationPanel: [{ user: { id: administrator.id, name: administrator.name }, evaluator: true, chair: true, order: 0 }],
    });
    let deleted = false;
    serve((method, path) => {
      if (path === `/api/opportunities/sprint-with-us/${ID}`) {
        if (method === "DELETE") {
          deleted = true;
          return json(200, draft);
        }
        return method === "GET" && !deleted ? json(200, draft) : null;
      }
      if (method === "GET" && path === "/api/opportunities/sprint-with-us") return json(200, deleted ? [] : [draft]);
      if (method === "GET" && (path === "/api/opportunities/code-with-us" || path === "/api/opportunities/team-with-us")) return json(200, []);
      return null;
    });
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    const router = renderAt(`/opportunities/sprint-with-us/${ID}/edit`);
    fireEvent.click(await screen.findByTestId("opportunity-delete-button"));
    fireEvent.click(await screen.findByTestId("opportunity-delete-confirm"));

    await waitFor(() => expect(router.state.location.pathname).toBe("/dashboard"));
    expect(requests.some((request) => request.method === "DELETE" && request.address === `/api/opportunities/sprint-with-us/${ID}`)).toBe(true);
    expect(await screen.findByTestId("dashboard-empty-message")).toBeTruthy();
    expect(screen.queryByText("An administrator's sprint draft")).toBeNull();
  });

  it("shows its author, once it is published, the details read-only and nothing to change them with", async () => {
    serve((method, path) => (method === "GET" && path === `/api/opportunities/sprint-with-us/${ID}` ? json(200, sprint()) : null));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt(`/opportunities/sprint-with-us/${ID}/edit?tab=opportunity`);
    const title = (await screen.findByTestId("opportunity-title-field")).querySelector("input") as HTMLInputElement;
    expect(title.readOnly).toBe(true);
    expect(title.value).toBe("Modernize the licence renewal service");
    expect(screen.queryByTestId("opportunity-save-changes")).toBeNull();
    expect(screen.queryByTestId("opportunity-edit-button")).toBeNull();
    expect(screen.queryByTestId("opportunity-delete-button")).toBeNull();
    expect((document.getElementById("opp-deadline") as HTMLInputElement | null)?.value ?? "").toBe("2030-10-16");
  });

  it("lets an administrator change a published opportunity's details, sending the content but never the panel", async () => {
    serve((method, path) => (path === `/api/opportunities/team-with-us/${ID}` && (method === "GET" || method === "PUT") ? json(200, team()) : null));
    resetSessionForTests({ status: "signed-in", account: account({ id: "00000000-0000-4000-8000-000000000101", type: "ADMIN" }) }, fakeIdentity());
    renderAt(`/opportunities/team-with-us/${ID}/edit?tab=opportunity`);
    const title = (await screen.findByTestId("opportunity-title-field")).querySelector("input") as HTMLInputElement;
    fireEvent.change(title, { target: { value: "Data platform team, renamed" } });
    // It holds no resource question, so nothing is sent until it does (R-1.17).
    fireEvent.click(screen.getByTestId("opportunity-save-changes"));
    expect((await screen.findByTestId("field-error")).textContent).toBe("Resource questions: add at least one resource question.");
    expect(requests.some((request) => request.method === "PUT")).toBe(false);
    const questions = within(document.getElementById("form-resource-questions")?.closest("section") as HTMLElement);
    fireEvent.click(questions.getByTestId("add-resource-question-button"));
    for (const [testId, value] of [
      ["question-text-field", "How?"],
      ["question-guideline-field", "Detail."],
    ] as const) {
      fireEvent.change(screen.getByTestId(testId).querySelector("textarea") as HTMLTextAreaElement, { target: { value } });
    }
    for (const [testId, value] of [
      ["question-score-field", "5"],
      ["question-word-limit-field", "300"],
    ] as const) {
      const input = screen.getByTestId(testId).querySelector("input") as HTMLInputElement;
      fireEvent.change(input, { target: { value } });
      fireEvent.blur(input);
    }
    fireEvent.click(screen.getByTestId("opportunity-save-changes"));
    await waitFor(() => expect(requests.some((request) => request.method === "PUT")).toBe(true));
    const sent = requests.find((request) => request.method === "PUT")?.body as { tag: string; value: Record<string, unknown> };
    expect(sent.tag).toBe("edit");
    expect(sent.value).toMatchObject({
      title: "Data platform team, renamed",
      maxBudget: 900_000,
      challengeWeight: 50,
      resourceQuestions: [{ question: "How?", guideline: "Detail.", score: 5, minimumScore: null, wordLimit: 300 }],
    });
    expect(sent.value).not.toHaveProperty("evaluationPanel");
  });
});

describe("the public views (R-1.8, R-7.17, R-7.29)", () => {
  const scope = "## What a sprint covers\n\nEvery sprint is **agile**. <script>alert('x')</script>";

  it("embeds the scope page's body exactly as its own address renders it, markup shown and never run", async () => {
    serve((method, path) => {
      if (method === "GET" && path === `/api/opportunities/sprint-with-us/${ID}`) return json(200, sprint({ createdBy: undefined, updatedBy: undefined }));
      if (method === "GET" && path === "/api/content/sprint-with-us-opportunity-scope") {
        return json(200, {
          id: "p",
          slug: "sprint-with-us-opportunity-scope",
          title: "sprint-with-us-opportunity-scope",
          body: scope,
          createdAt: "2026-01-05T17:00:00.000Z",
          updatedAt: "2026-01-05T17:00:00.000Z",
        });
      }
      if (method === "PUT") return json(200, {});
      return null;
    });
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(`/opportunities/sprint-with-us/${ID}`);
    const embedded = await screen.findByTestId("opportunity-scope-body");
    expect(embedded.querySelector("script")).toBeNull();
    expect(embedded.textContent).toContain("<script>alert('x')</script>");
    expect(within(embedded).getByRole("heading", { name: "What a sprint covers" })).toBeTruthy();
    expect(screen.getByTestId("opportunity-total-max-budget").textContent).toBe("$1,200,000");
    expect(screen.getByTestId("opportunity-phases").textContent).toContain("Prototype phase: November 2, 2030 to January 29, 2031");
    expect(screen.queryByTestId("opportunity-resources")).toBeNull();
    expect(screen.getByTestId("opportunity-watch-toggle")).toBeTruthy();
    expect(screen.queryByTestId("opportunity-created-by")).toBeNull();
    const embeddedHtml = embedded.innerHTML;

    // The same body at its own address renders to the same markup.
    document.body.innerHTML = "";
    renderAt("/content/sprint-with-us-opportunity-scope");
    expect((await screen.findByTestId("content-page-body")).innerHTML).toBe(embeddedHtml);
  });

  it("leaves the scope section empty, saying nothing, when the page cannot be read, and shows the rest in full", async () => {
    serve((method, path) => {
      if (method === "GET" && path === `/api/opportunities/sprint-with-us/${ID}`) return json(200, sprint());
      if (method === "PUT") return json(200, {});
      return null;
    });
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(`/opportunities/sprint-with-us/${ID}`);
    expect(await screen.findByTestId("opportunity-phases")).toBeTruthy();
    await waitFor(() => expect(requests.some((request) => request.address === "/api/content/sprint-with-us-opportunity-scope")).toBe(true));
    expect(screen.getByTestId("opportunity-scope").textContent).toBe("");
    expect(screen.getByTestId("opportunity-addenda")).toBeTruthy();
    expect(screen.getByTestId("opportunity-identifier").textContent).toBe(ID);
  });

  it("shows a Team With Us opportunity's resources, contract dates and terms, and counts the view", async () => {
    serve((method, path) => {
      if (method === "GET" && path === `/api/opportunities/team-with-us/${ID}`) return json(200, team());
      if (method === "GET" && path === "/api/content/team-with-us-terms-and-conditions") {
        return json(200, {
          id: "t",
          slug: "team-with-us-terms-and-conditions",
          title: "Terms",
          body: "The terms.",
          createdAt: "2026-01-05T17:00:00.000Z",
          updatedAt: "2026-01-05T17:00:00.000Z",
        });
      }
      if (method === "PUT") return json(200, {});
      return null;
    });
    resetSessionForTests({ status: "visitor" }, fakeIdentity());
    renderAt(`/opportunities/team-with-us/${ID}`);
    expect((await screen.findByTestId("opportunity-resources")).textContent).toContain("Data Professional: 50% of full time");
    expect(screen.getByTestId("opportunity-max-budget").textContent).toBe("$900,000");
    expect(screen.getByTestId("opportunity-start-date").textContent).toBe("Start date: November 2, 2030");
    expect(screen.getByTestId("opportunity-completion-date").textContent).toBe("Completion date: October 29, 2031");
    expect((await screen.findByTestId("opportunity-terms-body")).textContent).toBe("The terms.");
    expect(screen.queryByTestId("opportunity-phases")).toBeNull();
    expect(screen.queryByTestId("opportunity-watch-toggle")).toBeNull();
    await waitFor(() => expect(requests.some((request) => request.method === "PUT" && request.address.includes("/api/counters/"))).toBe(true));
  });

  it("is the missing page for an opportunity the service does not show", async () => {
    serve(() => null);
    resetSessionForTests({ status: "visitor" }, fakeIdentity());
    renderAt(`/opportunities/team-with-us/${ID}`);
    expect(await screen.findByRole("heading", { level: 1, name: /not found/i })).toBeTruthy();
  });
});
