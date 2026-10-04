import { describe, expect, it } from "vitest";
import {
  PANEL_NO_CHAIR,
  PANEL_TOO_SMALL,
  PanelMemberCheck,
  isOtherComplete,
  mergedBody,
  newlyAddedMembers,
  otherFieldLabel,
  otherProblemFromLine,
  otherProblems,
  otherRefusalLine,
  panelMayChange,
  panelProblems,
  readOtherInput,
  readPanel,
} from "../src/rules/other-program-content";
import { draftOf } from "../src/rules/other-program-drafts";

const TODAY = "2026-10-02";

const SPRINT = {
  title: "Modernize the licence renewal service",
  location: "Victoria",
  description: "Licence holders renew on paper today.",
  remoteOk: "no",
  totalMaxBudget: 1_200_000,
  mandatorySkills: ["React"],
  proposalDeadline: "2026-10-16",
  assignmentDate: "2026-10-23",
  implementationPhase: { startDate: "2026-11-02", completionDate: "2027-09-30" },
  teamQuestions: [{ question: "Describe a service.", guideline: "Evidence.", score: 5, minimumScore: 3, wordLimit: 500 }],
  questionsWeight: 30,
  codeChallengeWeight: 30,
  scenarioWeight: 20,
  priceWeight: 20,
};

const TEAM = {
  title: "Data platform team",
  location: "Victoria",
  description: "Join the data platform team.",
  remoteOk: true,
  remoteDesc: "Two days a month on site.",
  maxBudget: 900_000,
  proposalDeadline: "2026-10-16",
  assignmentDate: "2026-10-23",
  startDate: "2026-11-02",
  completionDate: "2027-10-29",
  resources: [{ serviceArea: "FULL_STACK_DEVELOPER", targetAllocation: 100 }],
  resourceQuestions: [{ question: "How?", guideline: "Detail.", score: 10, wordLimit: 300 }],
  questionsWeight: 40,
  challengeWeight: 40,
  priceWeight: 20,
};

const sprintLines = (body: object) =>
  otherProblems("sprint-with-us", readOtherInput("sprint-with-us", body), TODAY).map(otherRefusalLine);
const teamLines = (body: object) => otherProblems("team-with-us", readOtherInput("team-with-us", body), TODAY).map(otherRefusalLine);

describe("a Sprint With Us or Team With Us opportunity that is not a draft", () => {
  it("accepts one that is complete", () => {
    expect(sprintLines(SPRINT)).toEqual([]);
    expect(teamLines(TEAM)).toEqual([]);
  });

  it("refuses a Sprint With Us budget over $5,000,000 or under $1, and any Team With Us budget under $1 but none above (R-1.13)", () => {
    const over = "totalMaxBudget: Enter a total maximum budget between $1 and $5,000,000, in whole dollars.";
    expect(sprintLines({ ...SPRINT, totalMaxBudget: 5_000_001 })).toEqual([over]);
    expect(sprintLines({ ...SPRINT, totalMaxBudget: 0 })).toEqual([over]);
    expect(sprintLines({ ...SPRINT, totalMaxBudget: 5_000_000 })).toEqual([]);
    expect(teamLines({ ...TEAM, maxBudget: 0 })).toEqual(["maxBudget: Enter a maximum budget of at least $1, in whole dollars."]);
    expect(teamLines({ ...TEAM, maxBudget: 50_000_000 })).toEqual([]);
  });

  it("refuses weights that do not total 100%, with the message saying so, and a weight outside 0 to 100 (R-1.15)", () => {
    expect(sprintLines({ ...SPRINT, priceWeight: 10 })).toEqual(["scoringWeights: The scoring weights must total 100%."]);
    expect(teamLines({ ...TEAM, challengeWeight: 120, priceWeight: -60 })).toEqual([
      "challengeWeight: Enter the challenge weight as a whole number from 0 to 100.",
      "priceWeight: Enter the price weight as a whole number from 0 to 100.",
      "scoringWeights: The scoring weights must total 100%.",
    ]);
  });

  it("refuses an inception phase without a prototype phase, and no implementation phase (R-1.16)", () => {
    const inception = { startDate: "2026-10-26", completionDate: "2026-10-30" };
    expect(sprintLines({ ...SPRINT, inceptionPhase: inception })).toEqual(["phases: A prototype phase must follow an inception phase."]);
    expect(
      sprintLines({ ...SPRINT, inceptionPhase: inception, prototypePhase: { startDate: "2026-10-31", completionDate: "2026-11-01" } }),
    ).toEqual([]);
    expect(sprintLines({ ...SPRINT, implementationPhase: undefined })).toEqual([
      "phases: Add an implementation phase. Every Sprint With Us opportunity has one.",
    ]);
  });

  it("keeps each phase's maximum budget and required capabilities, refusing budgets that are not whole dollars but not phase budgets that together exceed the total (R-2.19)", () => {
    const prototype = {
      startDate: "2026-10-26",
      completionDate: "2026-10-31",
      maxBudget: 200_000,
      requiredCapabilities: ["Frontend Development"],
    };
    const implementation = { ...SPRINT.implementationPhase, maxBudget: 300_000, requiredCapabilities: ["Backend Development"] };
    const body = { ...SPRINT, prototypePhase: prototype, implementationPhase: implementation };
    expect(sprintLines(body)).toEqual([]);
    expect(draftOf("sprint-with-us", body, TODAY).phases).toMatchObject([
      { phase: "PROTOTYPE", maxBudget: 200_000, requiredCapabilities: ["Frontend Development"] },
      { phase: "IMPLEMENTATION", maxBudget: 300_000, requiredCapabilities: ["Backend Development"] },
    ]);
    expect(sprintLines({ ...body, prototypePhase: { ...prototype, maxBudget: 0 } })).toEqual([
      "prototypePhase.maxBudget: Enter the prototype phase's maximum budget as a whole number of dollars, at least $1.",
    ]);
    // The old application accepts phase budgets (200,000 + 300,000) over a 400,000 total.
    expect(sprintLines({ ...body, totalMaxBudget: 400_000 })).toEqual([]);
    expect(draftOf("sprint-with-us", { ...body, totalMaxBudget: 400_000 }, TODAY).phases).toMatchObject([
      { phase: "PROTOTYPE", maxBudget: 200_000 },
      { phase: "IMPLEMENTATION", maxBudget: 300_000 },
    ]);
    // Left blank, the implementation phase holds what the other phases leave of the total.
    const blank = { ...body, implementationPhase: { ...implementation, maxBudget: null } };
    expect(sprintLines(blank)).toEqual([]);
    expect(draftOf("sprint-with-us", blank, TODAY).phases[1]?.maxBudget).toBe(1_000_000);
  });

  it("refuses a question outside its limits, naming the field, by its place in the list (R-1.17)", () => {
    const question = { question: "x".repeat(1001), guideline: "", score: 0, minimumScore: 0, wordLimit: 3001 };
    expect(sprintLines({ ...SPRINT, teamQuestions: [SPRINT.teamQuestions[0], question] })).toEqual([
      "teamQuestions.2.question: Enter a question of 1 to 1,000 characters.",
      "teamQuestions.2.guideline: Enter a guideline of 1 to 1,000 characters.",
      "teamQuestions.2.score: Enter a maximum score of at least 1, as a whole number.",
      "teamQuestions.2.wordLimit: Enter a response word limit between 1 and 3,000.",
    ]);
    expect(teamLines({ ...TEAM, resourceQuestions: [{ ...TEAM.resourceQuestions[0], minimumScore: 10 }] })).toEqual([
      "resourceQuestions.1.minimumScore: Enter a minimum score lower than the maximum score.",
    ]);
    expect(teamLines({ ...TEAM, resourceQuestions: [] })).toEqual(["resourceQuestions: Add at least one resource question."]);
  });

  it("accepts 101 questions, the last at position 100, and refuses a 102nd naming the questions (R-1.17)", () => {
    const many = (count: number) => Array.from({ length: count }, () => SPRINT.teamQuestions[0]);
    expect(sprintLines({ ...SPRINT, teamQuestions: many(101) })).toEqual([]);
    expect(sprintLines({ ...SPRINT, teamQuestions: many(102) })).toEqual(["teamQuestions: Add no more than 101 team questions."]);
    expect(teamLines({ ...TEAM, resourceQuestions: many(101).map(() => TEAM.resourceQuestions[0]) })).toEqual([]);
    expect(teamLines({ ...TEAM, resourceQuestions: many(102).map(() => TEAM.resourceQuestions[0]) })).toEqual([
      "resourceQuestions: Add no more than 101 resource questions.",
    ]);
    // A draft keeps up to 101 questions too.
    expect(draftOf("sprint-with-us", { ...SPRINT, teamQuestions: many(101) }, TODAY).questions).toHaveLength(101);
    expect(draftOf("sprint-with-us", { ...SPRINT, teamQuestions: many(102) }, TODAY).questions).toHaveLength(101);
  });

  it("refuses a resource outside 1 to 100 per cent or in an unrecognised service area (R-1.18)", () => {
    expect(teamLines({ ...TEAM, resources: [{ serviceArea: "ASTRONAUT", targetAllocation: 120 }] })).toEqual([
      "resources.1.serviceArea: Choose one of the five service areas.",
      "resources.1.targetAllocation: Enter a target allocation between 1 and 100 per cent of full time.",
    ]);
    expect(teamLines({ ...TEAM, resources: [{ serviceArea: "Data Professional", targetAllocation: 1 }] })).toEqual([]);
  });

  it("refuses the fields every program shares, and dates out of order (R-1.10, R-1.11, R-1.14)", () => {
    expect(teamLines({ ...TEAM, title: "", remoteDesc: "", proposalDeadline: "2026-10-01", startDate: "2026-10-20" })).toEqual([
      "title: Enter a title.",
      "remoteDesc: Describe the remote work, because remote work is acceptable.",
      "proposalDeadline: The proposal deadline cannot be before today.",
      "startDate: The start date cannot be before the assignment date.",
    ]);
  });

  it("is complete only with a panel of two with one chair", () => {
    const draft = draftOf("sprint-with-us", SPRINT, TODAY);
    const two = [
      { evaluator: true, chair: true },
      { evaluator: true, chair: false },
    ];
    expect(isOtherComplete("sprint-with-us", draft, two, TODAY)).toBe(true);
    expect(isOtherComplete("sprint-with-us", draft, two.slice(0, 1), TODAY)).toBe(false);
    expect(isOtherComplete("sprint-with-us", { ...draft, title: "" }, two, TODAY)).toBe(false);
  });
});

describe("the evaluation panel (R-1.55, R-5.1, R-5.9, R-5.37)", () => {
  const member = (user: string, name: string, roles: Partial<PanelMemberCheck> = {}): PanelMemberCheck => ({
    user,
    name,
    kind: "GOV",
    active: true,
    evaluator: true,
    chair: false,
    ...roles,
  });
  const lines = (members: PanelMemberCheck[]) => panelProblems(members).map(otherRefusalLine);

  it("accepts two public sector employees, one of them the chair, or a chair who does not evaluate", () => {
    expect(lines([member("a", "Ann", { chair: true }), member("b", "Bo")])).toEqual([]);
    expect(lines([member("a", "Ann"), member("b", "Bo", { evaluator: false, chair: true })])).toEqual([]);
  });

  it("refuses one member, the same person twice, no chair, two chairs, and anyone who is not a public sector employee", () => {
    expect(lines([member("a", "Ann", { chair: true })])).toEqual([`evaluationPanel: ${PANEL_TOO_SMALL}`]);
    expect(lines([member("a", "Ann", { chair: true }), member("a", "Ann")])).toEqual([
      "evaluationPanel: Panel member 2: Ann is already on the panel.",
    ]);
    expect(lines([member("a", "Ann"), member("b", "Bo")])).toEqual([`evaluationPanel: ${PANEL_NO_CHAIR}`]);
    expect(lines([member("a", "Ann", { chair: true }), member("b", "Bo", { chair: true })])).toEqual([
      "evaluationPanel: Choose only one chair. The panel names 2.",
    ]);
    expect(lines([member("a", "Ann", { chair: true }), member("v", "Val", { kind: "VENDOR" })])).toEqual([
      "evaluationPanel: Panel member 2: Val is not a public sector employee.",
    ]);
    expect(lines([member("a", "Ann", { chair: true }), member("z", "", { kind: null, name: null })])).toEqual([
      "evaluationPanel: Panel member 2: choose a public sector employee.",
    ]);
  });

  it("refuses a member who is neither an evaluator nor the chair, naming them (R-5.37)", () => {
    expect(lines([member("a", "Test Evaluator One", { chair: true }), member("b", "Test Evaluator Two", { evaluator: false })])).toEqual([
      "evaluationPanel: Panel member 2: Test Evaluator Two must be an evaluator, the chair, or both.",
    ]);
  });

  it("reads a panel exactly as sent, an account named by identifier or by record", () => {
    expect(
      readPanel([
        { user: "AB", evaluator: true, chair: "true" },
        { user: { id: "cd" }, evaluator: false },
        { evaluator: true },
      ]),
    ).toEqual([
      { user: "ab", evaluator: true, chair: true },
      { user: "cd", evaluator: false, chair: false },
      { user: null, evaluator: true, chair: false },
    ]);
    expect(readPanel({ evaluationPanel: [{ user: "x", chair: true }] })).toEqual([{ user: "x", evaluator: false, chair: true }]);
  });

  it("may be changed until the consensus stage begins (R-1.43, R-5.16)", () => {
    for (const status of ["DRAFT", "UNDER_REVIEW", "PUBLISHED", "EVAL_QUESTIONS_INDIVIDUAL"] as const) expect(panelMayChange(status)).toBe(true);
    for (const status of ["EVAL_QUESTIONS_CONSENSUS", "EVAL_CC", "EVAL_C", "PROCESSING", "AWARDED", "CANCELED"] as const) {
      expect(panelMayChange(status)).toBe(false);
    }
  });

  it("tells only the people newly added, and nobody while a draft (R-5.17)", () => {
    expect(newlyAddedMembers("PUBLISHED", ["a", "b"], ["a", "b", "c"])).toEqual(["c"]);
    expect(newlyAddedMembers("PUBLISHED", ["a", "b"], ["b"])).toEqual([]);
    expect(newlyAddedMembers("DRAFT", ["a"], ["a", "c"])).toEqual([]);
  });
});

describe("changing what is kept", () => {
  it("keeps what a change leaves out, removes a phase named as null, and never takes the panel", () => {
    const kept = draftOf("sprint-with-us", { ...SPRINT, prototypePhase: { startDate: "2026-10-24", completionDate: "2026-10-30" } }, TODAY);
    const merged = mergedBody("sprint-with-us", kept, { title: "New title", prototypePhase: null, evaluationPanel: [{ user: "x" }] });
    expect(merged.title).toBe("New title");
    expect(merged.location).toBe("Victoria");
    expect(merged.prototypePhase).toBeUndefined();
    expect(merged.evaluationPanel).toBeUndefined();
    expect(sprintLines(merged)).toEqual([]);
  });

  it("names refused fields as the form labels them", () => {
    expect(otherFieldLabel("sprint-with-us", "totalMaxBudget")).toBe("Total maximum budget");
    expect(otherFieldLabel("sprint-with-us", "teamQuestions.1.minimumScore")).toBe("Question 1, minimum score");
    expect(otherFieldLabel("team-with-us", "resources.2.targetAllocation")).toBe("Resource 2, target allocation");
    expect(otherFieldLabel("sprint-with-us", "inceptionPhase.startDate")).toBe("Inception phase, start date");
    expect(otherFieldLabel("team-with-us", "challengeWeight")).toBe("Challenge weight");
    expect(otherProblemFromLine("teamQuestions.1.score: Enter a score.")).toEqual({ field: "teamQuestions.1.score", message: "Enter a score." });
  });
});
