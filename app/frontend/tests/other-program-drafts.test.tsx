import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Account } from "../src/api/accounts";
import type { IdentityClient } from "../src/auth/identity-client";
import { resetSessionForTests } from "../src/auth/session";
import { routeTree } from "../src/router";
import { createPanelProblems } from "../src/screens/opportunity-other-form";

/**
 * Creating Sprint With Us and Team With Us opportunities (opportunity-swu-create,
 * opportunity-twu-create, and the manage page a new one lands on; decision records 0035 and 0045).
 * The service is stood in for; what is checked is what the screens show and what they ask of it.
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
const administrator = account({ id: "00000000-0000-4000-8000-000000000101", type: "ADMIN", name: "Robin Placeholder" });
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

const ID = "00000000-0000-4000-8000-000000000901";

const drafted = (program: string, overrides: Record<string, unknown> = {}) => ({
  id: ID,
  program,
  createdAt: "2026-10-01T17:00:00.000Z",
  updatedAt: "2026-10-01T17:00:00.000Z",
  createdBy: { id: staff.id, name: staff.name },
  updatedBy: { id: staff.id, name: staff.name },
  status: "DRAFT",
  publishedAt: null,
  title: "Replace the grant intake forms",
  teaser: "",
  location: "",
  remoteOk: false,
  remoteDesc: "",
  description: "",
  proposalDeadline: "2026-10-15",
  assignmentDate: "2026-10-15",
  subscribed: false,
  ...(program === "sprint-with-us" ? { totalMaxBudget: 0 } : { maxBudget: 0, startDate: "2026-10-15", completionDate: null }),
  ...overrides,
});

const requests: { method: string; address: string; body: unknown }[] = [];

function serve(handler: (method: string, path: string, body: unknown) => Response) {
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
  render(<RouterProvider router={router as never} />);
  return router;
}

const field = (testId: string) => screen.getByTestId(testId).querySelector("input, textarea") as HTMLInputElement;

beforeEach(() => {
  requests.length = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetSessionForTests();
});

describe("creating a Sprint With Us draft (R-1.7, R-1.9, R-1.39)", () => {
  it("saves what the form holds as a draft and lands on its manage page, which shows its identifier", async () => {
    serve((method, path) => {
      if (method === "POST" && path === "/api/opportunities/sprint-with-us") return json(201, drafted("sprint-with-us"));
      if (method === "GET" && path === `/api/opportunities/sprint-with-us/${ID}`) return json(200, drafted("sprint-with-us"));
      return json(404, { errors: ["Not here."] });
    });
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    const router = renderAt("/opportunities/sprint-with-us/create");
    expect(await screen.findByRole("heading", { level: 1, name: "Create a Sprint With Us opportunity" })).toBeTruthy();
    expect(screen.getByTestId("opportunity-submit-for-review")).toBeTruthy();
    expect(screen.queryByTestId("opportunity-start-date-field")).toBeNull();

    fireEvent.change(field("opportunity-title-field"), { target: { value: "Replace the grant intake forms" } });
    fireEvent.change(field("opportunity-deadline-field"), { target: { value: "2030-05-01" } });
    fireEvent.click(screen.getByTestId("opportunity-save-draft"));

    expect(await screen.findByTestId("opportunity-identifier")).toBeTruthy();
    expect(screen.getByTestId("opportunity-identifier").textContent).toBe(ID);
    expect(router.state.location.pathname).toBe(`/opportunities/sprint-with-us/${ID}/edit`);
    const sent = requests.find((request) => request.method === "POST");
    expect(sent?.body).toMatchObject({
      status: "DRAFT",
      title: "Replace the grant intake forms",
      proposalDeadline: "2030-05-01",
      assignmentDate: "",
      remoteOk: false,
      totalMaxBudget: null,
    });
    expect(screen.getByTestId("opportunity-created-by").textContent).toBe("Casey Placeholder");
  });

  it("carries every test id its story draws, with the date fields at the story's ids", async () => {
    serve(() => json(404, { errors: ["Not here."] }));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/opportunities/sprint-with-us/create");
    await screen.findByTestId("opportunity-save-draft");
    for (const testId of [
      "opportunity-title-field",
      "opportunity-teaser-field",
      "opportunity-location-field",
      "opportunity-remote-field",
      "opportunity-remote-description-field",
      "opportunity-budget-field",
      "opportunity-skills-field",
      "opportunity-description-field",
      "opportunity-deadline-field",
      "opportunity-assignment-date-field",
      "phase-start-date-field",
      "phase-completion-date-field",
      "add-phase-button",
      "question-text-field",
      "question-guideline-field",
      "question-score-field",
      "question-minimum-score-field",
      "question-word-limit-field",
      "add-team-question-button",
      "evaluation-panel-editor",
      "attachment-add-button",
      "opportunity-submit-for-review",
    ]) {
      expect(screen.getAllByTestId(testId).length, testId).toBeGreaterThan(0);
    }
    expect(screen.getAllByTestId("score-weight-field")).toHaveLength(4);
    expect(document.getElementById("opp-deadline")).not.toBeNull();
    expect(document.getElementById("opp-assignment")).not.toBeNull();
  });

  it("saves as a draft what the form holds: the shared fields, phases, team questions, weights and panel", async () => {
    serve((method, path) => {
      if (method === "POST" && path === "/api/opportunities/sprint-with-us") return json(201, drafted("sprint-with-us"));
      if (method === "GET" && path === `/api/opportunities/sprint-with-us/${ID}`) return json(200, drafted("sprint-with-us"));
      return json(404, { errors: ["Not here."] });
    });
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/opportunities/sprint-with-us/create");
    await screen.findByTestId("opportunity-title-field");
    fireEvent.change(field("opportunity-title-field"), { target: { value: "A draft" } });
    fireEvent.click(screen.getAllByTestId("add-phase-button")[0] as HTMLElement);
    fireEvent.change(screen.getAllByTestId("phase-start-date-field")[0]?.querySelector("input") as HTMLInputElement, {
      target: { value: "2030-03-01" },
    });
    fireEvent.change(screen.getByTestId("question-text-field").querySelector("textarea") as HTMLTextAreaElement, {
      target: { value: "Why your team?" },
    });
    fireEvent.click(screen.getByTestId("opportunity-save-draft"));

    expect(await screen.findByTestId("opportunity-identifier")).toBeTruthy();
    expect(requests.find((request) => request.method === "POST")?.body).toMatchObject({
      status: "DRAFT",
      title: "A draft",
      mandatorySkills: [],
      inceptionPhase: { startDate: "2030-03-01", completionDate: "" },
      prototypePhase: null,
      implementationPhase: { startDate: "", completionDate: "" },
      teamQuestions: [{ question: "Why your team?", guideline: "", score: null, minimumScore: null, wordLimit: null }],
      questionsWeight: null,
      codeChallengeWeight: null,
      scenarioWeight: null,
      priceWeight: null,
      // Nobody chosen yet: the service gives the draft its author alone (decision record 0045).
      evaluationPanel: [],
    });
  });

  it("lets the team questions run to 101, positions 0 to 100, and no further (R-1.17)", async () => {
    serve(() => json(404, { errors: ["Not here."] }));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/opportunities/sprint-with-us/create");
    const add = (await screen.findByTestId("add-team-question-button")) as HTMLButtonElement;
    while (screen.getAllByTestId("question-text-field").length < 101) {
      expect(add.disabled).toBe(false);
      fireEvent.click(add);
    }
    expect(screen.getAllByTestId("question-text-field")).toHaveLength(101);
    expect(add.disabled).toBe(true);
  }, 120_000);

  it("starts the panel as its story draws it: two members to choose, each an evaluator, neither the chair", async () => {
    serve(() => json(404, { errors: ["Not here."] }));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/opportunities/sprint-with-us/create");
    const editor = await screen.findByTestId("evaluation-panel-editor");
    expect(within(editor).getAllByRole("group").map((group) => group.querySelector("legend")?.textContent)).toEqual([
      "Panel member 1",
      "Panel member 2",
    ]);
    const boxes = within(editor).getAllByRole("checkbox") as HTMLInputElement[];
    expect(boxes.map((box) => box.checked)).toEqual([true, false, true, false]);
  });

  it("names the Resources section by its heading (Team With Us)", async () => {
    serve(() => json(404, { errors: ["Not here."] }));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/opportunities/team-with-us/create");
    const section = await screen.findByRole("region", { name: "Resources" });
    expect(within(section).getByTestId("add-resource-button")).toBeTruthy();
  });

  it("checks the whole form before submitting for review, naming each problem and sending nothing (R-1.13 to R-1.17, R-1.55)", async () => {
    serve(() => json(404, { errors: ["Not here."] }));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/opportunities/sprint-with-us/create");
    await screen.findByTestId("opportunity-title-field");
    fireEvent.click(screen.getAllByTestId("add-phase-button")[0] as HTMLElement);
    fireEvent.click(screen.getByTestId("opportunity-submit-for-review"));
    const named = (await screen.findAllByTestId("field-error")).map((item) => item.textContent);
    expect(named).toEqual(
      expect.arrayContaining([
        "Title: enter a title.",
        "Total maximum budget: enter a total maximum budget between $1 and $5,000,000, in whole dollars.",
        "Phases: a prototype phase must follow an inception phase.",
        "Team questions: add at least one team question.",
        "Scoring weights: the scoring weights must total 100%.",
        "Evaluation panel: the panel needs at least two members.",
      ]),
    );
    expect(screen.getByTestId("score-weight-error")).toBeTruthy();
    expect(requests.some((request) => request.method === "POST")).toBe(false);
  });

  it("totals the scoring weights as they are entered, and says when they do not make 100%", async () => {
    serve(() => json(404, { errors: ["Not here."] }));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/opportunities/sprint-with-us/create");
    await screen.findByTestId("opportunity-save-draft");
    expect(screen.getByText("Total: 0%")).toBeTruthy();
    expect(screen.queryByTestId("score-weight-error")).toBeNull();
    const weight = (index: number) => screen.getAllByTestId("score-weight-field")[index]?.querySelector("input") as HTMLInputElement;
    fireEvent.change(weight(0), { target: { value: "60" } });
    fireEvent.blur(weight(0));
    expect(await screen.findByText("Total: 60%")).toBeTruthy();
    expect(screen.getByTestId("score-weight-error").textContent).toBe("The scoring weights must total 100%.");
    fireEvent.change(weight(3), { target: { value: "40" } });
    fireEvent.blur(weight(3));
    expect(await screen.findByText("Total: 100%")).toBeTruthy();
    expect(screen.queryByTestId("score-weight-error")).toBeNull();
  });

  it("names each reason the service refuses it for, keeping what was entered", async () => {
    serve((method) =>
      method === "POST" ? json(400, { errors: ["status: An opportunity is created as a draft."] }) : json(404, { errors: ["Not here."] }),
    );
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/opportunities/sprint-with-us/create");
    await screen.findByTestId("opportunity-title-field");
    fireEvent.change(field("opportunity-title-field"), { target: { value: "Kept" } });
    fireEvent.click(screen.getByTestId("opportunity-save-draft"));
    expect((await screen.findByTestId("field-error")).textContent).toBe("status: an opportunity is created as a draft.");
    expect(field("opportunity-title-field").value).toBe("Kept");
  });

  it("shows the service's refusal about the remote work question in the summary and on the question (R-1.11)", async () => {
    serve((method) =>
      method === "POST" ? json(400, { errors: ["remoteOk: Say whether remote work is acceptable."] }) : json(404, { errors: ["Not here."] }),
    );
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/opportunities/team-with-us/create");
    await screen.findByTestId("opportunity-title-field");
    fireEvent.click(screen.getByTestId("opportunity-save-draft"));
    expect((await screen.findByTestId("field-error")).textContent).toBe("Remote work: say whether remote work is acceptable.");
    expect(screen.getByTestId("opportunity-remote-field").textContent).toContain("Say whether remote work is acceptable.");
  });

  it("has no accessibility violations, with an inception phase added", async () => {
    serve(() => json(404, { errors: ["Not here."] }));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/opportunities/sprint-with-us/create");
    fireEvent.click((await screen.findAllByTestId("add-phase-button"))[0] as HTMLElement);
    const results = await axe.run(document.body, { rules: { region: { enabled: false } } });
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  });

  it("shows anybody but public sector staff the missing page", async () => {
    serve(() => json(404, { errors: ["Not here."] }));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt("/opportunities/sprint-with-us/create");
    expect(await screen.findByRole("heading", { level: 1, name: /not found/i })).toBeTruthy();
    expect(screen.queryByTestId("opportunity-save-draft")).toBeNull();
  });
});

describe("creating a Team With Us draft", () => {
  it("offers its own dates and budget, and an administrator Publish in place of Submit for review", async () => {
    serve((method, path) => {
      if (method === "POST" && path === "/api/opportunities/team-with-us") return json(201, drafted("team-with-us"));
      if (method === "GET" && path === `/api/opportunities/team-with-us/${ID}`) return json(200, drafted("team-with-us"));
      return json(404, { errors: ["Not here."] });
    });
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt("/opportunities/team-with-us/create");
    expect(await screen.findByTestId("opportunity-start-date-field")).toBeTruthy();
    expect(screen.getByTestId("opportunity-completion-date-field")).toBeTruthy();
    expect(screen.getByTestId("opportunity-publish")).toBeTruthy();
    expect(screen.queryByTestId("opportunity-submit-for-review")).toBeNull();
    expect(screen.getByText("Maximum budget")).toBeTruthy();

    for (const testId of ["resource-service-area-field", "resource-allocation-field", "add-resource-button", "add-resource-question-button", "evaluation-panel-editor"]) {
      expect(screen.getAllByTestId(testId).length, testId).toBeGreaterThan(0);
    }
    expect(screen.getAllByTestId("score-weight-field")).toHaveLength(3);
    expect(screen.queryByTestId("add-phase-button")).toBeNull();
    expect(document.getElementById("opp-start")).not.toBeNull();

    fireEvent.change(field("opportunity-start-date-field"), { target: { value: "2030-06-01" } });
    fireEvent.click(screen.getByTestId("opportunity-save-draft"));
    await screen.findByTestId("opportunity-identifier");
    const sent = requests.find((request) => request.method === "POST")?.body as Record<string, unknown>;
    expect(sent).toMatchObject({ status: "DRAFT", startDate: "2030-06-01", maxBudget: null, resources: [], challengeWeight: null });
    expect(sent).not.toHaveProperty("implementationPhase");
  });

  it("asks an administrator to confirm before publishing only once the form passes the program's rules", async () => {
    serve(() => json(404, { errors: ["Not here."] }));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt("/opportunities/team-with-us/create");
    fireEvent.click(await screen.findByTestId("opportunity-publish"));
    expect((await screen.findAllByTestId("field-error")).length).toBeGreaterThan(0);
    expect(screen.queryByTestId("opportunity-publish-confirm")).toBeNull();
    expect(requests.some((request) => request.method === "POST")).toBe(false);
  });

  it("has no accessibility violations", async () => {
    serve(() => json(404, { errors: ["Not here."] }));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/opportunities/team-with-us/create");
    await screen.findByTestId("opportunity-title-field");
    const results = await axe.run(document.body, { rules: { region: { enabled: false } } });
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  });
});

describe("the manage page a draft lands on", () => {
  it("is shown to nobody but its author and administrators", async () => {
    serve((method, path) =>
      method === "GET" && path === `/api/opportunities/sprint-with-us/${ID}`
        ? json(200, drafted("sprint-with-us", { status: "PUBLISHED", createdBy: undefined, updatedBy: undefined }))
        : json(404, { errors: ["Not here."] }),
    );
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(`/opportunities/sprint-with-us/${ID}/edit`);
    expect(await screen.findByRole("heading", { level: 1, name: /not found/i })).toBeTruthy();
    await waitFor(() => expect(screen.queryByTestId("opportunity-identifier")).toBeNull());
  });
});

describe("the create form's panel rules (R-1.55, R-5.1)", () => {
  const nameOf = (id: string) => ({ a: "Ann", b: "Bo" })[id] ?? null;
  const messages = (panel: { user: string; evaluator: boolean; chair: boolean }[]) =>
    createPanelProblems(panel, nameOf).map((problem) => problem.message);

  it("leaves out a row with nobody chosen, so one chosen person is a panel too small", () => {
    expect(messages([{ user: "a", evaluator: true, chair: true }, { user: "", evaluator: true, chair: false }])).toEqual([
      "The panel needs at least two members.",
    ]);
  });

  it("numbers a member's problem by its row on the form", () => {
    expect(
      messages([
        { user: "a", evaluator: true, chair: true },
        { user: "", evaluator: true, chair: false },
        { user: "a", evaluator: true, chair: false },
      ]),
    ).toEqual(["Panel member 3: Ann is already on the panel."]);
  });

  it("accepts two people with one chair", () => {
    expect(messages([{ user: "a", evaluator: true, chair: false }, { user: "b", evaluator: true, chair: true }])).toEqual([]);
  });
});
