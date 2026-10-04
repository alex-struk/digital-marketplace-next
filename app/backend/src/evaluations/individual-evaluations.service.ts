import { BadRequestException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { NamedRefusal } from "../common/refusals";
import { MAIL_SETTINGS, Mailer } from "../mail/mailer";
import { blindCopiedToStaff } from "../mail/message";
import { readyForConsensus } from "../mail/notifications/evaluation";
import { MailSettings } from "../mail/settings";
import { CLOCK, Clock } from "../opportunities/cwu-opportunities.service";
import { OPPORTUNITY_RECORDS_STORE, OpportunityRecordsStore } from "../opportunities/opportunity-records";
import { OTHER_PROGRAMS_STORE, OtherProgramsStore, StoredSummary } from "../opportunities/other-programs";
import {
  EnteredScore,
  EvaluatedOpportunity,
  EvaluationReader,
  EvaluationStatus,
  INCOMPLETE_EVALUATION,
  NAMED_PROPOSAL_NOT_UNDER_REVIEW,
  NEW_EVALUATION_IS_A_DRAFT,
  NOT_AN_EVALUATOR,
  NOT_AT_INDIVIDUAL_EVALUATION,
  NO_EVALUATION_THERE,
  NO_PROPONENTS_TO_EVALUATE,
  ONLY_YOUR_OWN_EVALUATION,
  PROPONENT_NOT_UNDER_REVIEW,
  PROPOSAL_NOT_OF_OPPORTUNITY,
  SCORES_ALREADY_SUBMITTED,
  SUBMITTED_EVALUATION_FIXED,
  byAnonymousName,
  duplicateEvaluationRefusal,
  hasClosedForEvaluation,
  individualEvaluationIsComplete,
  isCompleteEvaluation,
  isEvaluatorOn,
  isOnPanel,
  mayAskForEvaluations,
  mayReadIndividualEvaluation,
  readEnteredScores,
  readNamedProposals,
  UNREADABLE_NAMED_PROPOSALS,
  unrecognisedEvaluationRequest,
} from "../rules/individual-evaluation";
import { mayReadConsensus } from "../rules/consensus";
import type { OtherProgram } from "../rules/other-program-drafts";
import { INDIVIDUAL_EVALUATION_STORE, IndividualEvaluationStore, Proponent, StoredEvaluation } from "./individual-evaluation";

/** How one evaluation is answered with: the proponent by anonymous name, the evaluator by name. */
export interface EvaluationAnswer {
  readonly proposal: { readonly id: string; readonly anonymousProponentName: string };
  readonly evaluationPanelMember: { readonly id: string; readonly name: string };
  readonly status: EvaluationStatus;
  readonly scores: readonly EnteredScore[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** A proponent as the panel is told of it on the opportunity (R-5.35): its anonymous name and answers. */
export interface ProponentAnswer {
  readonly id: string;
  readonly anonymousProponentName: string;
  readonly status: string | null;
  readonly responses: readonly { readonly order: number; readonly response: string }[];
}

/** Proposal states that have not gone forward to evaluation. */
const NOT_EVALUATED = new Set(["DRAFT", "SUBMITTED", "WITHDRAWN"]);
const UNDER_REVIEW_OF_QUESTIONS = "UNDER_REVIEW_QUESTIONS";

const NO_PROPOSAL_THERE = "There is no such proposal.";

/**
 * Individual evaluation of a Sprint With Us or Team With Us opportunity's questions (decision
 * record 0062): starting, reading and changing an evaluator's own evaluation of one proponent
 * (R-5.3, R-5.21 to R-5.24, R-5.26), who may read whose (R-5.11, R-5.28), submitting an evaluator's
 * whole set (R-5.25), and the move to consensus once every evaluator has, with its notice to the
 * chair and the owner (R-5.27). Both programs alike (R-5.36).
 */
@Injectable()
export class IndividualEvaluationsService {
  private readonly log = new Logger(IndividualEvaluationsService.name);

  constructor(
    @Inject(INDIVIDUAL_EVALUATION_STORE) private readonly store: IndividualEvaluationStore,
    @Inject(OTHER_PROGRAMS_STORE) private readonly opportunities: Pick<OtherProgramsStore, "find">,
    @Inject(OPPORTUNITY_RECORDS_STORE) private readonly records: Pick<OpportunityRecordsStore, "recipient">,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly mailer: Mailer,
    @Inject(MAIL_SETTINGS) private readonly mail: Pick<MailSettings, "serviceOrigin" | "batchSize">,
  ) {}

  /** Every evaluation of one proponent the person may read (R-5.28); nothing to anybody unconnected (R-5.11). */
  async listForProposal(viewer: EvaluationReader | null, program: OtherProgram, proposalId: string): Promise<EvaluationAnswer[]> {
    const { opportunity } = await this.locate(program, proposalId);
    const context = evaluatedOf(opportunity);
    if (!mayAskForEvaluations(viewer, context)) throw new NotFoundException(NO_PROPOSAL_THERE);
    const evaluations = await this.store.evaluations(program, { proposal: proposalId });
    return evaluations.filter((evaluation) => mayReadIndividualEvaluation(viewer, evaluation.evaluator.id, context)).map(answerOf);
  }

  /** The person's own evaluations, across every proponent of the opportunity (R-5.5 note). */
  async listForOpportunity(viewer: EvaluationReader | null, program: OtherProgram, opportunityId: string): Promise<EvaluationAnswer[]> {
    const opportunity = await this.opportunities.find(program, opportunityId.toLowerCase());
    if (!opportunity || !mayAskForEvaluations(viewer, evaluatedOf(opportunity))) throw new NotFoundException(NO_EVALUATION_THERE);
    const evaluations = await this.store.evaluations(program, { opportunity: opportunity.id });
    return evaluations.filter((evaluation) => evaluation.evaluator.id === viewer?.id).map(answerOf);
  }

  /** One evaluator's evaluation of one proponent, to whoever may read it; to anyone else, none there. */
  async read(viewer: EvaluationReader | null, program: OtherProgram, proposalId: string, evaluatorId: string): Promise<EvaluationAnswer> {
    const { opportunity } = await this.locate(program, proposalId);
    if (!mayReadIndividualEvaluation(viewer, evaluatorId.toLowerCase(), evaluatedOf(opportunity))) {
      throw new NotFoundException(NO_EVALUATION_THERE);
    }
    const found = (await this.store.evaluations(program, { proposal: proposalId })).find(
      (evaluation) => evaluation.evaluator.id === evaluatorId.toLowerCase(),
    );
    if (!found) throw new NotFoundException(NO_EVALUATION_THERE);
    return answerOf(found);
  }

  /**
   * Starts the person's draft of one proponent (R-5.21): only an evaluator on the panel, only while
   * the questions are evaluated individually, and only once per proponent (R-5.3). The scores are
   * kept as sent; they are checked when the set is submitted (R-5.23).
   */
  async create(viewer: EvaluationReader | null, program: OtherProgram, proposalId: string, body: unknown): Promise<EvaluationAnswer> {
    const { proponent, opportunity } = await this.locate(program, proposalId);
    const context = evaluatedOf(opportunity);
    this.mustRecord(viewer, context);
    const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    if ("status" in record && record.status !== "DRAFT") throw new BadRequestException([NEW_EVALUATION_IS_A_DRAFT]);
    if (typeof record.proposal === "string" && record.proposal.toLowerCase() !== proponent.id) {
      throw new BadRequestException([PROPOSAL_NOT_OF_OPPORTUNITY]);
    }
    if (proponent.status !== UNDER_REVIEW_OF_QUESTIONS) throw new BadRequestException([PROPONENT_NOT_UNDER_REVIEW]);
    const evaluator = viewer as EvaluationReader;
    const scores = readEnteredScores(record.scores, questionsOf(opportunity).length);
    const created = await this.store.create(program, proponent.id, evaluator.id, scores, this.clock());
    if (!created) throw new NamedRefusal(409, "conflict", [duplicateEvaluationRefusal(program)]);
    return this.read(evaluator, program, proponent.id, evaluator.id);
  }

  /**
   * Changes the person's own draft (R-5.24): while it is a draft and the questions are still
   * evaluated individually. Nobody changes another's evaluation, and a submitted one is fixed.
   */
  async edit(
    viewer: EvaluationReader | null,
    program: OtherProgram,
    proposalId: string,
    evaluatorId: string,
    change: { readonly tag?: unknown; readonly value?: unknown },
  ): Promise<EvaluationAnswer> {
    // Only "edit" is recognised here: an evaluation is never submitted on its own (R-5.26).
    if (change?.tag !== "edit") throw new BadRequestException([unrecognisedEvaluationRequest(change?.tag)]);
    const { proponent, opportunity } = await this.locate(program, proposalId);
    const context = evaluatedOf(opportunity);
    if (!viewer || viewer.id !== evaluatorId.toLowerCase()) {
      if (mayReadIndividualEvaluation(viewer, evaluatorId.toLowerCase(), context)) throw new UnauthorizedException(ONLY_YOUR_OWN_EVALUATION);
      throw new NotFoundException(NO_EVALUATION_THERE);
    }
    const found = (await this.store.evaluations(program, { proposal: proponent.id })).find((evaluation) => evaluation.evaluator.id === viewer.id);
    if (!found) throw new NotFoundException(NO_EVALUATION_THERE);
    if (found.status === "SUBMITTED") throw new BadRequestException([SUBMITTED_EVALUATION_FIXED]);
    this.mustRecord(viewer, context);
    const scores = readEnteredScores(change.value, questionsOf(opportunity).length);
    await this.store.update(program, proponent.id, viewer.id, scores, this.clock());
    return this.read(viewer, program, proponent.id, viewer.id);
  }

  /**
   * Submits the person's evaluations of the proposals the request names (R-5.25, R-5.26; decision
   * record 0064): only when each named one is complete, and otherwise none of it; a proponent left
   * unnamed is neither checked nor submitted. A request naming none means every proponent under
   * review of the questions. When that brings the submitted scores to one per question per
   * evaluator for each proponent the submission named, the opportunity moves to consensus and the
   * chair and the owner are told (R-5.27).
   */
  async submitAll(viewer: EvaluationReader | null, opportunity: StoredSummary, value?: unknown): Promise<void> {
    const context = evaluatedOf(opportunity);
    this.mustRecord(viewer, context);
    const evaluator = viewer as EvaluationReader;
    const program = opportunity.program;
    const questions = questionsOf(opportunity);
    const named = readNamedProposals(value);
    if (named === undefined) throw new BadRequestException([UNREADABLE_NAMED_PROPOSALS]);
    const underReview = (await this.store.proponents(program, opportunity.id)).filter((proponent) => proponent.status === UNDER_REVIEW_OF_QUESTIONS);
    const awaited = named === null ? underReview : named.map((id) => underReview.find((proponent) => proponent.id === id));
    if (awaited.some((proponent) => proponent === undefined)) throw new BadRequestException([NAMED_PROPOSAL_NOT_UNDER_REVIEW]);
    if (awaited.length === 0) throw new BadRequestException([NO_PROPONENTS_TO_EVALUATE]);
    const proposals = awaited.map((proponent) => (proponent as Proponent).id);
    const mine = (await this.store.evaluations(program, { opportunity: opportunity.id })).filter((evaluation) => evaluation.evaluator.id === evaluator.id);
    const own = proposals.map((id) => mine.find((evaluation) => evaluation.proposal.id === id));
    if (own.every((evaluation) => evaluation?.status === "SUBMITTED")) throw new BadRequestException([SCORES_ALREADY_SUBMITTED]);
    if (own.some((evaluation) => !evaluation || !isCompleteEvaluation(questions, evaluation.scores))) {
      throw new BadRequestException([INCOMPLETE_EVALUATION]);
    }
    const drafts = own.filter((evaluation): evaluation is StoredEvaluation => evaluation?.status === "DRAFT").map((evaluation) => evaluation.proposal.id);
    const evaluators = context.panel.filter((seat) => seat.evaluator).map((seat) => seat.user);
    // Counted over the proponents this submission names, as R-5.27 v2 has it.
    const { movedToConsensus } = await this.store.submit(program, opportunity.id, drafts, evaluator.id, this.clock(), (submitted) =>
      individualEvaluationIsComplete({ evaluators, proposals, questionCount: questions.length, submitted }),
    );
    if (movedToConsensus) await this.tellOfConsensus(opportunity);
  }

  /**
   * The proponents the panel evaluates, by anonymous name and in that order, with their answers
   * (R-5.35), told only once the opportunity has closed, and only to the panel's members and to
   * whoever may read the consensus listed by them (R-5.12, R-5.28; decision record 0063).
   */
  async proponentsFor(viewer: EvaluationReader | null, opportunity: StoredSummary): Promise<ProponentAnswer[] | undefined> {
    const context = evaluatedOf(opportunity);
    if (!(isOnPanel(viewer, context) || mayReadConsensus(viewer, context)) || !hasClosedForEvaluation(opportunity.status)) return undefined;
    const proponents = await this.store.proponents(opportunity.program, opportunity.id);
    return proponents
      .filter((proponent) => !NOT_EVALUATED.has(proponent.status ?? ""))
      .sort(byAnonymousName)
      .map(({ id, anonymousProponentName, status, responses }) => ({ id, anonymousProponentName, status, responses }));
  }

  // ---------------------------------------------------------------------- checks

  private mustRecord(viewer: EvaluationReader | null, context: EvaluatedOpportunity): void {
    if (!isEvaluatorOn(viewer, context)) throw new UnauthorizedException(NOT_AN_EVALUATOR);
    if (context.status !== "EVAL_QUESTIONS_INDIVIDUAL") throw new BadRequestException([NOT_AT_INDIVIDUAL_EVALUATION]);
  }

  private async locate(program: OtherProgram, proposalId: string): Promise<{ proponent: Proponent; opportunity: StoredSummary }> {
    const proponent = await this.store.proponent(program, proposalId.toLowerCase());
    const opportunity = proponent ? await this.opportunities.find(program, proponent.opportunity) : null;
    if (!proponent || !opportunity) throw new NotFoundException(NO_PROPOSAL_THERE);
    return { proponent, opportunity };
  }

  // ---------------------------------------------------------------------- telling people

  /**
   * The chair and the owner, as blind copies of one message visibly addressed to the service alone,
   * so nobody sees who else was told (R-5.27, R-6.15; decision record 0063), each an active account
   * (R-6.17). Sent after the answer; a failure to look them
   * up never fails the submission (R-6.2).
   */
  private async tellOfConsensus(opportunity: StoredSummary): Promise<void> {
    try {
      const people = new Set<string>([
        ...(opportunity.details?.panel ?? []).filter((member) => member.chair).map((member) => member.user.id),
        ...(opportunity.createdBy ? [opportunity.createdBy.id] : []),
      ]);
      const recipients = await Promise.all([...people].map((person) => this.records.recipient(person)));
      const addresses = recipients.filter((person) => person !== null).map((person) => person.email);
      const message = readyForConsensus({ program: opportunity.program, id: opportunity.id, title: opportunity.title }, this.mail.serviceOrigin);
      this.mailer.sendEach(blindCopiedToStaff(addresses, message, this.mail.batchSize));
    } catch (error: unknown) {
      this.log.error(`The people to tell could not be read: ${error instanceof Error ? error.name : "fault"}.`);
    }
  }
}

/** What the evaluation rules turn on, read from an opportunity as it is kept. */
export function evaluatedOf(opportunity: StoredSummary): EvaluatedOpportunity {
  return {
    status: opportunity.status,
    createdBy: opportunity.createdBy?.id ?? null,
    panel: (opportunity.details?.panel ?? []).map((member) => ({ user: member.user.id, evaluator: member.evaluator, chair: member.chair })),
  };
}

const questionsOf = (opportunity: StoredSummary) => opportunity.details?.questions ?? [];

export function answerOf(evaluation: StoredEvaluation): EvaluationAnswer {
  return {
    proposal: evaluation.proposal,
    evaluationPanelMember: evaluation.evaluator,
    status: evaluation.status,
    scores: evaluation.scores,
    createdAt: evaluation.createdAt.toISOString(),
    updatedAt: evaluation.updatedAt.toISOString(),
  };
}
