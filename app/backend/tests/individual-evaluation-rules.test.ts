import { describe, expect, it } from "vitest";
import {
  EvaluatedOpportunity,
  byAnonymousName,
  duplicateEvaluationRefusal,
  evaluationStatusLabel,
  evaluationTabsFor,
  individualEvaluationIsComplete,
  isCompleteEvaluation,
  mayAskForEvaluations,
  mayReadIndividualEvaluation,
  mayRecordIndividualEvaluation,
  readEnteredScores,
  scoreProblems,
  storedScore,
} from "../src/rules/individual-evaluation";

const OWNER = "owner";
const EVALUATOR = "evaluator";
const CHAIR = "chair";
const EVALUATING_CHAIR = "evaluating-chair";
const STRANGER = "stranger";
const ADMIN = "admin";

const staff = (id: string) => ({ id, type: "GOV" as const });
const administrator = { id: ADMIN, type: "ADMIN" as const };

const at = (status: EvaluatedOpportunity["status"]): EvaluatedOpportunity => ({
  status,
  createdBy: OWNER,
  panel: [
    { user: EVALUATOR, evaluator: true, chair: false },
    { user: EVALUATING_CHAIR, evaluator: true, chair: false },
    { user: CHAIR, evaluator: false, chair: true },
  ],
});

const fourQuestions = [{ score: 5 }, { score: 5 }, { score: 5 }, { score: 5 }];
const complete = [0, 1, 2, 3].map((order) => ({ order, score: 4, notes: "Good." }));

describe("who records an individual evaluation (R-5.21)", () => {
  it("is an evaluator on the panel, while the questions are evaluated individually", () => {
    expect(mayRecordIndividualEvaluation(staff(EVALUATOR), at("EVAL_QUESTIONS_INDIVIDUAL"))).toBe(true);
    expect(mayRecordIndividualEvaluation(staff(CHAIR), at("EVAL_QUESTIONS_INDIVIDUAL"))).toBe(false);
    expect(mayRecordIndividualEvaluation(staff(OWNER), at("EVAL_QUESTIONS_INDIVIDUAL"))).toBe(false);
    expect(mayRecordIndividualEvaluation(administrator, at("EVAL_QUESTIONS_INDIVIDUAL"))).toBe(false);
    for (const status of ["PUBLISHED", "EVAL_QUESTIONS_CONSENSUS", "EVAL_CC"] as const) {
      expect(mayRecordIndividualEvaluation(staff(EVALUATOR), at(status))).toBe(false);
    }
    expect(mayRecordIndividualEvaluation({ id: EVALUATOR, type: "VENDOR" }, at("EVAL_QUESTIONS_INDIVIDUAL"))).toBe(false);
  });
});

describe("who reads an individual evaluation (R-5.11, R-5.28)", () => {
  it("is only its evaluator before consensus", () => {
    const opportunity = at("EVAL_QUESTIONS_INDIVIDUAL");
    expect(mayReadIndividualEvaluation(staff(EVALUATOR), EVALUATOR, opportunity)).toBe(true);
    for (const reader of [staff(EVALUATING_CHAIR), staff(CHAIR), staff(OWNER), administrator, staff(STRANGER)]) {
      expect(mayReadIndividualEvaluation(reader, EVALUATOR, opportunity)).toBe(false);
    }
  });

  it("is every panel member once consensus begins, and not the owner or an administrator off the panel", () => {
    const opportunity = at("EVAL_QUESTIONS_CONSENSUS");
    for (const reader of [staff(EVALUATOR), staff(EVALUATING_CHAIR), staff(CHAIR)]) {
      expect(mayReadIndividualEvaluation(reader, EVALUATOR, opportunity)).toBe(true);
    }
    expect(mayReadIndividualEvaluation(staff(OWNER), EVALUATOR, opportunity)).toBe(false);
    expect(mayReadIndividualEvaluation(administrator, EVALUATOR, opportunity)).toBe(false);
  });

  it("opens to the owner and administrators past the question stages, and never to someone unconnected", () => {
    for (const status of ["EVAL_CC", "EVAL_SCENARIO", "EVAL_C", "PROCESSING", "AWARDED"] as const) {
      expect(mayReadIndividualEvaluation(staff(OWNER), EVALUATOR, at(status))).toBe(true);
      expect(mayReadIndividualEvaluation(administrator, EVALUATOR, at(status))).toBe(true);
      expect(mayReadIndividualEvaluation(staff(STRANGER), EVALUATOR, at(status))).toBe(false);
    }
    expect(mayReadIndividualEvaluation(null, EVALUATOR, at("AWARDED"))).toBe(false);
    expect(mayAskForEvaluations(staff(STRANGER), at("EVAL_CC"))).toBe(false);
    expect(mayAskForEvaluations(staff(OWNER), at("EVAL_CC"))).toBe(true);
  });
});

describe("the evaluation tools a person is offered (R-5.34)", () => {
  it("splits them by role", () => {
    const opportunity = at("EVAL_QUESTIONS_INDIVIDUAL");
    expect(evaluationTabsFor(staff(EVALUATOR), opportunity)).toEqual(["instructions", "evaluation"]);
    expect(evaluationTabsFor(staff(CHAIR), opportunity)).toEqual(["consensus"]);
    expect(evaluationTabsFor(staff(OWNER), opportunity)).toEqual(["consensus"]);
    expect(evaluationTabsFor(administrator, opportunity)).toEqual(["consensus"]);
    expect(evaluationTabsFor(staff(STRANGER), opportunity)).toEqual([]);
  });

  it("offers the consensus only once the opportunity has closed, and the evaluator's tools on a draft", () => {
    expect(evaluationTabsFor(staff(CHAIR), at("DRAFT"))).toEqual([]);
    expect(evaluationTabsFor(staff(OWNER), at("PUBLISHED"))).toEqual([]);
    expect(evaluationTabsFor(staff(EVALUATOR), at("DRAFT"))).toEqual(["instructions", "evaluation"]);
  });
});

describe("scores and comments (R-5.22)", () => {
  it("need a score in range with at most two decimals, and a comment, for every question", () => {
    expect(scoreProblems(fourQuestions, complete)).toEqual([]);
    const problems = scoreProblems(fourQuestions, [
      { order: 0, score: 6, notes: "Too high." },
      { order: 1, score: 3.125, notes: "" },
      { order: 2, score: 5, notes: "Top marks." },
    ]);
    expect(problems.map((problem) => problem.message)).toEqual([
      "Enter a score between 0 and 5 for question 1.",
      "Enter a score with no more than two decimal places for question 2.",
      "Enter a comment for question 2.",
      "Enter a score between 0 and 5 for question 4.",
      "Enter a comment for question 4.",
    ]);
    expect(isCompleteEvaluation(fourQuestions, [...complete.slice(0, 3), { order: 3, score: 2.25, notes: "  ok " }])).toBe(true);
    expect(isCompleteEvaluation(fourQuestions, [...complete.slice(0, 3), { order: 3, score: null, notes: "No score." }])).toBe(false);
  });

  it("are read from a request as entered, one per question, out of range or not (R-5.23)", () => {
    expect(readEnteredScores([{ order: 1, score: 6, notes: "" }, { order: 0, score: "2.5", notes: "x" }, { order: 9, score: 1, notes: "" }], 4)).toEqual([
      { order: 0, score: 2.5, notes: "x" },
      { order: 1, score: 6, notes: "" },
    ]);
    expect(readEnteredScores({ scores: [{ score: null, notes: "later" }] }, 4)).toEqual([{ order: 0, score: null, notes: "later" }]);
    expect(readEnteredScores("nonsense", 4)).toEqual([]);
  });

  it("are read back as they were entered from the schema's single-precision numbers", () => {
    expect(storedScore(Math.fround(4.33))).toBe(4.33);
    expect(storedScore(Math.fround(7.125))).toBe(7.125);
  });

  it("are described by state in words", () => {
    expect(evaluationStatusLabel(null, fourQuestions)).toBe("Not started");
    expect(evaluationStatusLabel({ status: "DRAFT", scores: complete }, fourQuestions)).toBe("Draft: complete");
    expect(evaluationStatusLabel({ status: "DRAFT", scores: complete.slice(1) }, fourQuestions)).toBe("Draft: incomplete");
    expect(evaluationStatusLabel({ status: "SUBMITTED", scores: complete }, fourQuestions)).toBe("Submitted");
  });
});

describe("the move to consensus (R-5.27)", () => {
  const submitted = (evaluator: string, proposal: string) => ({ evaluator, proposal, scored: [0, 1, 2, 3] });

  it("comes once the submitted scores number one per question per proponent per evaluator", () => {
    const base = { evaluators: ["a", "b"], proposals: ["p1", "p2", "p3"], questionCount: 4 };
    const all = ["p1", "p2", "p3"].flatMap((proposal) => [submitted("a", proposal), submitted("b", proposal)]);
    expect(individualEvaluationIsComplete({ ...base, submitted: all })).toBe(true);
    expect(individualEvaluationIsComplete({ ...base, submitted: all.slice(1) })).toBe(false);
    // Someone no longer on the panel, or a proponent not under review, does not count.
    expect(individualEvaluationIsComplete({ ...base, submitted: [...all.slice(1), submitted("gone", "p1")] })).toBe(false);
    // A panel that grows during individual evaluation waits for its new member too (R-5.16 note).
    expect(individualEvaluationIsComplete({ ...base, evaluators: ["a", "b", "c"], submitted: all })).toBe(false);
    expect(individualEvaluationIsComplete({ ...base, proposals: [], submitted: [] })).toBe(false);
  });
});

describe("the service's words", () => {
  it("name each program's questions in the duplicate refusal (R-5.3)", () => {
    expect(duplicateEvaluationRefusal("sprint-with-us")).toBe("You already have a team question evaluation for this proposal.");
    expect(duplicateEvaluationRefusal("team-with-us")).toBe("You already have a resource question evaluation for this proposal.");
  });

  it("order proponents by their anonymous names (R-5.35)", () => {
    const names = ["Proponent 10", "Proponent 2", "Proponent 1"].map((anonymousProponentName) => ({ anonymousProponentName }));
    expect([...names].sort(byAnonymousName).map((entry) => entry.anonymousProponentName)).toEqual(["Proponent 1", "Proponent 2", "Proponent 10"]);
  });
});
