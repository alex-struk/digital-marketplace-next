import { describe, expect, it } from "vitest";
import {
  ConsensusOf,
  NOT_ALL_CONSENSUSES_SUBMITTED,
  consensusStatusLabel,
  finalizeOutcome,
  isConsensusWithheldFrom,
  mayFinalizeConsensus,
  mayReadConsensus,
  mayRecordConsensus,
  maySubmitConsensusSet,
  meetsEveryMinimum,
  noScreenableProponentRefusal,
  offersFinalize,
  questionsScoreNote,
} from "../src/rules/consensus";
import type { EvaluatedOpportunity } from "../src/rules/individual-evaluation";
import type { OpportunityStatus } from "../src/rules/opportunities";
import { proposalHistoryLabel } from "../src/rules/proposals";

const admin = { id: "admin", type: "ADMIN" as const };
const owner = { id: "owner", type: "GOV" as const };
const chair = { id: "chair", type: "GOV" as const };
const evaluator = { id: "evaluator", type: "GOV" as const };
const stranger = { id: "stranger", type: "GOV" as const };

const at = (status: OpportunityStatus, panel = [
  { user: "chair", evaluator: true, chair: true },
  { user: "evaluator", evaluator: true, chair: false },
]): EvaluatedOpportunity => ({ status, createdBy: "owner", panel });

const questions = [
  { score: 5, minimumScore: null },
  { score: 5, minimumScore: null },
  { score: 5, minimumScore: null },
  { score: 5, minimumScore: 3 },
];
const agreed = (proposal: string, values: number[], status: "DRAFT" | "SUBMITTED" = "SUBMITTED"): ConsensusOf => ({
  proposal,
  anonymousProponentName: `Proponent ${proposal}`,
  status,
  scores: values.map((score, order) => ({ order, score, notes: "Agreed." })),
});
const proponents = (...ids: string[]) => ids.map((id) => ({ id, anonymousProponentName: `Proponent ${id}` }));

describe("who records, reads and finalises the consensus", () => {
  it("lets only the chair record it, and only at consensus (R-5.29)", () => {
    expect(mayRecordConsensus(chair, at("EVAL_QUESTIONS_CONSENSUS"))).toBe(true);
    expect(mayRecordConsensus(evaluator, at("EVAL_QUESTIONS_CONSENSUS"))).toBe(false);
    expect(mayRecordConsensus(admin, at("EVAL_QUESTIONS_CONSENSUS"))).toBe(false);
    expect(mayRecordConsensus(chair, at("EVAL_QUESTIONS_INDIVIDUAL"))).toBe(false);
    expect(mayRecordConsensus(chair, at("EVAL_CC"))).toBe(false);
  });

  it("shows it to an administrator at any stage, the panel from consensus, and the owner off the panel only after (R-5.12, R-5.28)", () => {
    expect(mayReadConsensus(admin, at("EVAL_QUESTIONS_INDIVIDUAL"))).toBe(true);
    expect(mayReadConsensus(evaluator, at("EVAL_QUESTIONS_INDIVIDUAL"))).toBe(false);
    expect(mayReadConsensus(evaluator, at("EVAL_QUESTIONS_CONSENSUS"))).toBe(true);
    expect(mayReadConsensus(owner, at("EVAL_QUESTIONS_CONSENSUS"))).toBe(false);
    expect(isConsensusWithheldFrom(owner, at("EVAL_QUESTIONS_CONSENSUS"))).toBe(true);
    // Before consensus there is nothing being withheld yet.
    expect(isConsensusWithheldFrom(owner, at("EVAL_QUESTIONS_INDIVIDUAL"))).toBe(false);
    expect(mayReadConsensus(owner, at("EVAL_C"))).toBe(true);
    expect(isConsensusWithheldFrom(owner, at("EVAL_C"))).toBe(false);
    expect(mayReadConsensus(stranger, at("EVAL_CC"))).toBe(false);
    expect(isConsensusWithheldFrom(stranger, at("EVAL_QUESTIONS_CONSENSUS"))).toBe(false);
    // An owner who sits on the panel sees it as the panel does.
    const seated = at("EVAL_QUESTIONS_CONSENSUS", [
      { user: "chair", evaluator: true, chair: true },
      { user: "owner", evaluator: true, chair: false },
    ]);
    expect(mayReadConsensus(owner, seated)).toBe(true);
  });

  it("offers finalising to the owner and administrators alike, at consensus only (R-5.14)", () => {
    expect(offersFinalize(owner, at("EVAL_QUESTIONS_CONSENSUS"))).toBe(true);
    expect(offersFinalize(admin, at("EVAL_QUESTIONS_CONSENSUS"))).toBe(true);
    expect(offersFinalize(chair, at("EVAL_QUESTIONS_CONSENSUS"))).toBe(false);
    expect(offersFinalize(owner, at("EVAL_QUESTIONS_INDIVIDUAL"))).toBe(false);
    expect(mayFinalizeConsensus({ id: "owner", type: "VENDOR" }, at("EVAL_QUESTIONS_CONSENSUS"))).toBe(false);
  });
});

describe("the chair's set", () => {
  it("reads each consensus's state in words", () => {
    expect(consensusStatusLabel(null, questions)).toBe("Not started");
    expect(consensusStatusLabel(agreed("1", [5, 5, 5], "DRAFT"), questions)).toBe("Draft: incomplete");
    expect(consensusStatusLabel(agreed("1", [5, 5, 5, 5], "DRAFT"), questions)).toBe("Draft: complete");
    expect(consensusStatusLabel(agreed("1", [5, 5, 5, 5]), questions)).toBe("Submitted");
  });

  it("is submitted only once every proponent under review has a complete consensus (R-5.13)", () => {
    expect(maySubmitConsensusSet(questions, ["1", "2"], [agreed("1", [5, 5, 5, 5], "DRAFT"), agreed("2", [4, 4, 4, 4], "DRAFT")])).toBe(true);
    expect(maySubmitConsensusSet(questions, ["1", "2"], [agreed("1", [5, 5, 5, 5], "DRAFT")])).toBe(false);
    expect(maySubmitConsensusSet(questions, ["1"], [agreed("1", [6, 5, 5, 5], "DRAFT")])).toBe(false);
    expect(maySubmitConsensusSet(questions, [], [])).toBe(false);
  });
});

describe("finalising", () => {
  it("is refused while a proponent under review has no submitted consensus (R-1.41, R-5.13)", () => {
    expect(finalizeOutcome("sprint-with-us", questions, proponents("1", "2"), [agreed("1", [5, 5, 5, 5])])).toEqual({
      kind: "refused",
      reason: NOT_ALL_CONSENSUSES_SUBMITTED,
    });
    expect(finalizeOutcome("sprint-with-us", questions, proponents("1"), [agreed("1", [5, 5, 5, 5], "DRAFT")])).toEqual({
      kind: "refused",
      reason: NOT_ALL_CONSENSUSES_SUBMITTED,
    });
  });

  it("is refused when nobody met every minimum, naming the stage that follows (R-5.10)", () => {
    const below = [agreed("1", [5, 5, 5, 2]), agreed("2", [5, 5, 5, 1])];
    expect(finalizeOutcome("sprint-with-us", questions, proponents("1", "2"), below)).toEqual({
      kind: "refused",
      reason: "You must have at least one proponent that can be screened into the Code Challenge.",
    });
    expect(finalizeOutcome("team-with-us", questions, proponents("1", "2"), below)).toEqual({
      kind: "refused",
      reason: noScreenableProponentRefusal("team-with-us"),
    });
    expect(noScreenableProponentRefusal("team-with-us")).toMatch(/into the Challenge\.$/);
  });

  it("screens in the four best that met every minimum, leaving one below a minimum behind (R-2.29, R-5.32)", () => {
    const six = [
      agreed("1", [5, 5, 5, 5]),
      agreed("2", [5, 5, 4, 4]),
      agreed("3", [4, 4, 4, 4]),
      agreed("4", [4, 4, 3, 3]),
      agreed("5", [3, 3, 3, 3]),
      agreed("6", [5, 5, 5, 2]),
    ];
    const outcome = finalizeOutcome("sprint-with-us", questions, proponents("1", "2", "3", "4", "5", "6"), six);
    expect(outcome).toMatchObject({ kind: "finalized", screenedIn: ["1", "2", "3", "4"] });
    if (outcome.kind === "finalized") expect(outcome.recorded).toHaveLength(6);
    const three = finalizeOutcome("team-with-us", questions, proponents("1", "2", "3", "4", "6"), six);
    expect(three).toMatchObject({ kind: "finalized", screenedIn: ["1", "2", "3"] });
  });

  it("passes over a proponent no longer under review, and keeps the anonymous order between equal totals", () => {
    const outcome = finalizeOutcome("team-with-us", questions, proponents("2", "10"), [
      agreed("1", [5, 5, 5, 5]),
      agreed("10", [4, 4, 4, 4]),
      agreed("2", [4, 4, 4, 4]),
    ]);
    expect(outcome).toMatchObject({ kind: "finalized", screenedIn: ["2", "10"] });
  });

  it("checks only the questions that set a minimum", () => {
    expect(meetsEveryMinimum(questions, agreed("1", [0, 0, 0, 3]).scores)).toBe(true);
    expect(meetsEveryMinimum(questions, agreed("1", [5, 5, 5, 2.99]).scores)).toBe(false);
  });

  it("writes each proponent's agreed scores in its history's words (R-5.32)", () => {
    expect(questionsScoreNote("sprint-with-us", 4, agreed("1", [5, 5, 5, 5]).scores)).toBe("Team question scores were entered. Q1: 5; Q2: 5; Q3: 5; Q4: 5.");
    expect(questionsScoreNote("team-with-us", 2, agreed("1", [3.5, 4.25]).scores)).toBe("Resource question scores were entered. Q1: 3.5; Q2: 4.25.");
    expect(proposalHistoryLabel({ status: null, event: "QUESTIONS_SCORE_ENTERED", note: "Team question scores were entered. Q1: 5." })).toBe(
      "Team question scores entered",
    );
    expect(proposalHistoryLabel({ status: null, event: "QUESTIONS_SCORE_ENTERED", note: "Resource question scores were entered. Q1: 5." })).toBe(
      "Resource question scores entered",
    );
  });
});
