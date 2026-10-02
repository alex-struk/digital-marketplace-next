import { describe, expect, it } from "vitest";
import { OpportunityViewer } from "../src/rules/opportunities";
import { SWU_BUDGET_MAX, creationDecision, draftOf, remoteWorkProblems, weightTotal } from "../src/rules/other-program-drafts";

const ADMIN: OpportunityViewer = { id: "admin-1", type: "ADMIN" };
const STAFF: OpportunityViewer = { id: "staff-1", type: "GOV" };
const VENDOR: OpportunityViewer = { id: "vendor-1", type: "VENDOR" };

describe("creating a Sprint With Us or Team With Us opportunity before slice 10 (R-1.7, R-1.48)", () => {
  it("accepts a draft from public sector staff and administrators, a draft being what is asked for when nothing is", () => {
    expect(creationDecision(STAFF, { status: "DRAFT" })).toBe("DRAFT");
    expect(creationDecision(STAFF, {})).toBe("DRAFT");
    expect(creationDecision(ADMIN, { title: "x" })).toBe("DRAFT");
  });

  it("accepts one under review from any member of staff, and one published from an administrator", () => {
    expect(creationDecision(STAFF, { status: "UNDER_REVIEW" })).toBe("UNDER_REVIEW");
    expect(creationDecision(ADMIN, { status: "UNDER_REVIEW" })).toBe("UNDER_REVIEW");
    expect(creationDecision(ADMIN, { status: "PUBLISHED" })).toBe("PUBLISHED");
  });

  it("refuses a public sector employee who asks for it published, naming the rule", () => {
    expect(creationDecision(STAFF, { status: "PUBLISHED" })).toEqual({ kind: "only-administrators-publish" });
  });

  it("refuses anyone who is not public sector staff", () => {
    expect(creationDecision(VENDOR, { status: "DRAFT" })).toEqual({ kind: "not-permitted" });
    expect(creationDecision(null, {})).toEqual({ kind: "not-permitted" });
  });

  it("refuses a state an opportunity cannot be created in", () => {
    expect(creationDecision(ADMIN, { status: "AWARDED" })).toEqual({ kind: "unknown-state" });
  });
});

describe("remote work in the other two programs (R-1.11, decision records 0040 and 0041)", () => {
  const UNSTATED = "remoteOk: Say whether remote work is acceptable.";
  const DESCRIBE = "remoteDesc: Describe the remote work, because remote work is acceptable.";
  const TOO_LONG = "remoteDesc: Enter a remote work description of up to 500 characters.";

  it("refuses one under review or published that accepts remote work without describing it", () => {
    expect(remoteWorkProblems("UNDER_REVIEW", { remoteOk: true, remoteDesc: "" })).toEqual([DESCRIBE]);
    expect(remoteWorkProblems("PUBLISHED", { remoteOk: true })).toEqual([DESCRIBE]);
    expect(remoteWorkProblems("PUBLISHED", { remoteOk: "yes", remoteDesc: "   " })).toEqual([DESCRIBE]);
  });

  it("refuses one under review or published that does not say whether remote work is acceptable", () => {
    expect(remoteWorkProblems("PUBLISHED", { title: "Nothing said about remote work" })).toEqual([UNSTATED]);
    expect(remoteWorkProblems("UNDER_REVIEW", { remoteOk: null, remoteDesc: "" })).toEqual([UNSTATED]);
    expect(remoteWorkProblems("PUBLISHED", { remoteOk: "maybe", remoteDesc: "x".repeat(501) })).toEqual([UNSTATED, TOO_LONG]);
  });

  it("refuses a description over 500 characters whether or not remote work is acceptable", () => {
    expect(remoteWorkProblems("PUBLISHED", { remoteOk: false, remoteDesc: "x".repeat(501) })).toEqual([TOO_LONG]);
    expect(remoteWorkProblems("UNDER_REVIEW", { remoteOk: true, remoteDesc: "x".repeat(501) })).toEqual([TOO_LONG]);
  });

  it("accepts remote work described, remote work not acceptable with no description, and any draft", () => {
    expect(remoteWorkProblems("PUBLISHED", { remoteOk: true, remoteDesc: "x".repeat(500) })).toEqual([]);
    expect(remoteWorkProblems("PUBLISHED", { remoteOk: false, remoteDesc: "" })).toEqual([]);
    expect(remoteWorkProblems("UNDER_REVIEW", { remoteOk: "no" })).toEqual([]);
    expect(remoteWorkProblems("DRAFT", { title: "Nothing said about remote work" })).toEqual([]);
    expect(remoteWorkProblems("DRAFT", { remoteOk: true, remoteDesc: "x".repeat(501) })).toEqual([]);
  });
});

describe("what a new opportunity keeps (R-1.9 in the other two programs)", () => {
  const today = "2026-10-01";

  it("keeps a title alone, setting the missing dates fourteen days ahead, no budget, and an implementation phase", () => {
    expect(draftOf("sprint-with-us", { title: "Only a title" }, today)).toEqual({
      title: "Only a title",
      teaser: "",
      remoteOk: false,
      remoteDesc: "",
      location: "",
      budget: 0,
      description: "",
      proposalDeadline: "2026-10-15",
      assignmentDate: "2026-10-15",
      startDate: null,
      completionDate: null,
      skills: [],
      phases: [{ phase: "IMPLEMENTATION", startDate: "2026-10-15", completionDate: "2026-10-15", maxBudget: 0 }],
      questions: [],
      resources: [],
      weights: { questions: 0, codeChallenge: 0, scenario: 0, challenge: 0, price: 0 },
      panel: [],
    });
  });

  it("keeps the dates given in order, and replaces one earlier than the one it must follow", () => {
    const draft = draftOf(
      "team-with-us",
      { proposalDeadline: "2026-11-02", assignmentDate: "2026-10-20", startDate: "2026-12-01", completionDate: "2026-11-30" },
      today,
    );
    expect(draft.proposalDeadline).toBe("2026-11-02");
    expect(draft.assignmentDate).toBe("2026-10-15");
    expect(draft.startDate).toBe("2026-12-01");
    expect(draft.completionDate).toBeNull();
    expect(draft.phases).toEqual([]);
    expect(draftOf("sprint-with-us", { proposalDeadline: "2000-01-01" }, today).proposalDeadline).toBe("2026-10-15");
  });

  it("reads each program's budget by its own name and remote work as a yes or no", () => {
    expect(draftOf("sprint-with-us", { totalMaxBudget: SWU_BUDGET_MAX, maxBudget: 3 }, today).budget).toBe(SWU_BUDGET_MAX);
    expect(draftOf("team-with-us", { totalMaxBudget: 3, maxBudget: "$120,000" }, today).budget).toBe(120_000);
    expect(draftOf("team-with-us", { maxBudget: 1.5 }, today).budget).toBe(0);
    expect(draftOf("team-with-us", { remoteOk: true }, today).remoteOk).toBe(true);
    expect(draftOf("team-with-us", { remoteOk: "no" }, today).remoteOk).toBe(false);
  });

  it("keeps a Sprint With Us opportunity's skills, phases, team questions, weights and panel", () => {
    const draft = draftOf(
      "sprint-with-us",
      {
        totalMaxBudget: 900000,
        assignmentDate: "2026-11-01",
        mandatorySkills: ["React", "React", " "],
        inceptionPhase: { startDate: "2026-11-02", completionDate: "2026-11-30", maxBudget: 100000 },
        prototypePhase: { startDate: "2026-12-01" },
        implementationPhase: { startDate: "2027-01-04", completionDate: "2027-06-30" },
        teamQuestions: [{ question: "Why you?", guideline: "Fit", score: "5", minimumScore: 2, wordLimit: 300 }, {}],
        questionsWeight: 25,
        codeChallengeWeight: "40",
        scenarioWeight: 15,
        priceWeight: 20,
        evaluationPanel: [
          { user: "00000000-0000-4000-8000-000000000102", evaluator: true, chair: true },
          { user: "00000000-0000-4000-8000-000000000102", evaluator: true },
          { user: "not an identifier" },
        ],
      },
      today,
    );
    expect(draft.skills).toEqual(["React"]);
    expect(draft.phases).toEqual([
      { phase: "INCEPTION", startDate: "2026-11-02", completionDate: "2026-11-30", maxBudget: 100000 },
      { phase: "PROTOTYPE", startDate: "2026-12-01", completionDate: "2026-12-01", maxBudget: 0 },
      { phase: "IMPLEMENTATION", startDate: "2027-01-04", completionDate: "2027-06-30", maxBudget: 800000 },
    ]);
    expect(draft.questions).toEqual([{ question: "Why you?", guideline: "Fit", score: 5, minimumScore: 2, wordLimit: 300 }]);
    expect(weightTotal("sprint-with-us", draft.weights)).toBe(100);
    expect(draft.panel).toEqual([{ user: "00000000-0000-4000-8000-000000000102", evaluator: true, chair: true }]);
  });

  it("keeps a Team With Us opportunity's resources in a recognised service area, its questions and weights", () => {
    const draft = draftOf(
      "team-with-us",
      {
        resources: [
          { serviceArea: "FULL_STACK_DEVELOPER", targetAllocation: 100 },
          { serviceArea: "agile-coach", targetAllocation: "50" },
          { serviceArea: "ASTRONAUT", targetAllocation: 10 },
        ],
        resourceQuestions: [{ question: "How?", guideline: "", score: 10, wordLimit: 500 }],
        questionsWeight: 30,
        challengeWeight: 40,
        priceWeight: 30,
        codeChallengeWeight: 99,
      },
      today,
    );
    expect(draft.resources).toEqual([
      { serviceArea: "FULL_STACK_DEVELOPER", targetAllocation: 100 },
      { serviceArea: "AGILE_COACH", targetAllocation: 50 },
    ]);
    expect(draft.questions).toEqual([{ question: "How?", guideline: "", score: 10, minimumScore: null, wordLimit: 500 }]);
    expect(draft.weights).toEqual({ questions: 30, codeChallenge: 0, scenario: 0, challenge: 40, price: 30 });
    expect(weightTotal("team-with-us", draft.weights)).toBe(100);
  });
});
