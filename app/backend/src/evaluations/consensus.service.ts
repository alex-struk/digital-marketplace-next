import { BadRequestException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { NamedRefusal } from "../common/refusals";
import { MAIL_SETTINGS, Mailer } from "../mail/mailer";
import { Envelope, blindCopiedToStaff } from "../mail/message";
import { EvaluatedOpportunityInBrief, consensusFinalized, consensusSubmitted } from "../mail/notifications/evaluation";
import { MailSettings } from "../mail/settings";
import { CLOCK, Clock } from "../opportunities/cwu-opportunities.service";
import { CWU_OPPORTUNITY_STORE, CwuOpportunityStore } from "../opportunities/cwu-opportunity";
import { OPPORTUNITY_RECORDS_STORE, OpportunityRecordsStore } from "../opportunities/opportunity-records";
import { OTHER_PROGRAMS_STORE, OtherProgramsStore, StoredSummary } from "../opportunities/other-programs";
import {
  FINALIZE_NOT_AT_CONSENSUS,
  INCOMPLETE_CONSENSUS,
  NEW_CONSENSUS_IS_A_DRAFT,
  NOT_AT_CONSENSUS,
  NOT_PERMITTED_TO_FINALIZE,
  NOT_THE_CHAIR,
  NO_CONSENSUS_THERE,
  ONLY_THE_CHAIRS_CONSENSUS,
  consensusWithheld,
  duplicateConsensusRefusal,
  finalizeOutcome,
  isConsensusWithheldFrom,
  mayFinalizeConsensus,
  mayReadConsensus,
  maySubmitConsensusSet,
  questionsScoreNote,
} from "../rules/consensus";
import {
  EvaluatedOpportunity,
  EvaluationReader,
  PROPONENT_NOT_UNDER_REVIEW,
  PROPOSAL_NOT_OF_OPPORTUNITY,
  byAnonymousName,
  isChairOf,
  readEnteredScores,
} from "../rules/individual-evaluation";
import type { OtherProgram } from "../rules/other-program-drafts";
import { CONSENSUS_STORE, ConsensusStore } from "./consensus";
import { INDIVIDUAL_EVALUATION_STORE, IndividualEvaluationStore, Proponent } from "./individual-evaluation";
import { EvaluationAnswer, answerOf, evaluatedOf } from "./individual-evaluations.service";

const UNDER_REVIEW_OF_QUESTIONS = "UNDER_REVIEW_QUESTIONS";
const NO_PROPOSAL_THERE = "There is no such proposal.";

/**
 * The consensus of a Sprint With Us or Team With Us opportunity's questions (decision record
 * 0063): the chair starting, reading and changing the agreed scores of one proponent (R-5.29,
 * R-5.30), who may read them (R-5.12, R-5.28), the chair submitting the set and the owner and
 * administrators being told (R-5.31), and finalising — the one way out of the stage, from the
 * owner or an administrator — with its refusals (R-1.41, R-1.50, R-5.10, R-5.13, R-5.14), its
 * screening (R-2.29, R-5.32) and its notice to the chair and the owner (R-5.33). Both programs
 * alike (R-5.36).
 */
@Injectable()
export class ConsensusService {
  private readonly log = new Logger(ConsensusService.name);

  constructor(
    @Inject(CONSENSUS_STORE) private readonly store: ConsensusStore,
    @Inject(INDIVIDUAL_EVALUATION_STORE) private readonly proposals: Pick<IndividualEvaluationStore, "proponent" | "proponents">,
    @Inject(OTHER_PROGRAMS_STORE) private readonly opportunities: Pick<OtherProgramsStore, "find">,
    @Inject(OPPORTUNITY_RECORDS_STORE) private readonly records: Pick<OpportunityRecordsStore, "recipient">,
    @Inject(CWU_OPPORTUNITY_STORE) private readonly people: Pick<CwuOpportunityStore, "activeAdministrators">,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly mailer: Mailer,
    @Inject(MAIL_SETTINGS) private readonly mail: Pick<MailSettings, "serviceOrigin" | "batchSize">,
  ) {}

  /**
   * Every consensus of the opportunity, to whoever may read it (R-5.28); the owner off the panel
   * is told why not while it is agreed (R-5.12); anybody unconnected finds nothing there.
   */
  async listForOpportunity(viewer: EvaluationReader | null, program: OtherProgram, opportunityId: string): Promise<EvaluationAnswer[]> {
    const opportunity = await this.opportunities.find(program, opportunityId.toLowerCase());
    if (!opportunity) throw new NotFoundException(NO_CONSENSUS_THERE);
    const context = evaluatedOf(opportunity);
    if (!mayReadConsensus(viewer, context)) {
      if (isConsensusWithheldFrom(viewer, context)) throw new UnauthorizedException(consensusWithheld(program));
      throw new NotFoundException(NO_CONSENSUS_THERE);
    }
    const consensuses = await this.store.consensuses(program, { opportunity: opportunity.id });
    return consensuses.sort((a, b) => byAnonymousName(a.proposal, b.proposal)).map(answerOf);
  }

  /** The consensus of one proponent, held under the chair who recorded it. */
  async read(viewer: EvaluationReader | null, program: OtherProgram, proposalId: string, chairId: string): Promise<EvaluationAnswer> {
    const { opportunity } = await this.locate(program, proposalId);
    if (!mayReadConsensus(viewer, evaluatedOf(opportunity))) throw new NotFoundException(NO_CONSENSUS_THERE);
    const found = (await this.store.consensuses(program, { proposal: proposalId.toLowerCase() })).find(
      (consensus) => consensus.evaluator.id === chairId.toLowerCase(),
    );
    if (!found) throw new NotFoundException(NO_CONSENSUS_THERE);
    return answerOf(found);
  }

  /**
   * Starts the chair's draft consensus of one proponent (R-5.29): only the chair, only at the
   * consensus stage, only for a proponent under review of the questions, and once per proponent.
   * Kept as sent; checked when the set is submitted.
   */
  async create(viewer: EvaluationReader | null, program: OtherProgram, proposalId: string, body: unknown): Promise<EvaluationAnswer> {
    const { proponent, opportunity } = await this.locate(program, proposalId);
    const context = evaluatedOf(opportunity);
    this.mustRecord(viewer, context);
    const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    if ("status" in record && record.status !== "DRAFT") throw new BadRequestException([NEW_CONSENSUS_IS_A_DRAFT]);
    if (typeof record.proposal === "string" && record.proposal.toLowerCase() !== proponent.id) {
      throw new BadRequestException([PROPOSAL_NOT_OF_OPPORTUNITY]);
    }
    if (proponent.status !== UNDER_REVIEW_OF_QUESTIONS) throw new BadRequestException([PROPONENT_NOT_UNDER_REVIEW]);
    const chair = viewer as EvaluationReader;
    const scores = readEnteredScores(record.scores, questionsOf(opportunity).length);
    const created = await this.store.create(program, proponent.id, chair.id, scores, this.clock());
    if (!created) throw new NamedRefusal(409, "conflict", [duplicateConsensusRefusal(program)]);
    return this.read(chair, program, proponent.id, chair.id);
  }

  /**
   * Changes the agreed scores (R-5.30): the chair, at the consensus stage, as often as they like; a
   * submitted consensus stays submitted. Anybody else, or at any other stage, is not permitted.
   */
  async edit(
    viewer: EvaluationReader | null,
    program: OtherProgram,
    proposalId: string,
    chairId: string,
    change: { readonly tag?: unknown; readonly value?: unknown },
  ): Promise<EvaluationAnswer> {
    const { proponent, opportunity } = await this.locate(program, proposalId);
    const context = evaluatedOf(opportunity);
    const found = (await this.store.consensuses(program, { proposal: proponent.id })).find(
      (consensus) => consensus.evaluator.id === chairId.toLowerCase(),
    );
    // Anybody who may not read it finds nothing there; whoever may, and is not the chair who holds
    // it, is told it is not theirs to change, and so is the chair once the stage is over.
    if (!found || !mayReadConsensus(viewer, context)) throw new NotFoundException(NO_CONSENSUS_THERE);
    if (viewer?.id !== found.evaluator.id) throw new UnauthorizedException(ONLY_THE_CHAIRS_CONSENSUS);
    this.mustRecord(viewer, context);
    if (change?.tag !== "edit") throw new BadRequestException([`"${String(change?.tag)}" is not recognised for a consensus.`]);
    const scores = readEnteredScores(change.value, questionsOf(opportunity).length);
    await this.store.update(program, proponent.id, found.evaluator.id, scores, this.clock());
    return this.read(viewer, program, proponent.id, found.evaluator.id);
  }

  /**
   * The chair submits the set (R-5.29, R-5.30, R-5.31): once every proponent under review of the
   * questions has a complete consensus, each is recorded as submitted — afresh if it already was —
   * and the opportunity's owner and every administrator are told.
   */
  async submitAll(viewer: EvaluationReader | null, opportunity: StoredSummary): Promise<void> {
    const context = evaluatedOf(opportunity);
    this.mustRecord(viewer, context);
    const chair = viewer as EvaluationReader;
    const program = opportunity.program;
    const awaited = await this.awaited(opportunity);
    const consensuses = (await this.store.consensuses(program, { opportunity: opportunity.id })).map((consensus) => ({
      proposal: consensus.proposal.id,
      anonymousProponentName: consensus.proposal.anonymousProponentName,
      status: consensus.status,
      scores: consensus.scores,
      chair: consensus.evaluator.id,
    }));
    const ids = awaited.map((proponent) => proponent.id);
    if (!maySubmitConsensusSet(questionsOf(opportunity), ids, consensuses)) throw new BadRequestException([INCOMPLETE_CONSENSUS]);
    // Each is held under whoever recorded it; the chair submits them all.
    const held = consensuses.filter((consensus) => ids.includes(consensus.proposal));
    const byChair = new Map<string, string[]>();
    for (const consensus of held) byChair.set(consensus.chair, [...(byChair.get(consensus.chair) ?? []), consensus.proposal]);
    const at = this.clock();
    for (const [member, proposals] of byChair) await this.store.submit(program, proposals, member, at);
    await this.tell(async () => {
      const [administrators, owner] = await Promise.all([
        this.people.activeAdministrators(),
        opportunity.createdBy ? this.records.recipient(opportunity.createdBy.id) : Promise.resolve(null),
      ]);
      const addresses = [...(owner ? [owner.email] : []), ...administrators.map((person) => person.email)];
      return blindCopiedToStaff(addresses, consensusSubmitted(briefOf(opportunity), this.mail.serviceOrigin), this.mail.batchSize);
    });
  }

  /**
   * Finalising, the one way out of the consensus stage (R-1.50): from the opportunity's owner or an
   * administrator (R-5.14), only at that stage, refused unless every proponent under review of the
   * questions has a submitted consensus (R-5.13, R-1.41) and unless at least one met every minimum,
   * the refusal naming the stage that follows (R-5.10). Otherwise each proponent's agreed scores
   * are written on its history, the highest-scoring that met every minimum are screened in, the
   * opportunity moves on (R-2.29, R-5.32), and the chair and the owner are told (R-5.33).
   */
  async finalize(viewer: EvaluationReader | null, opportunity: StoredSummary): Promise<void> {
    const context = evaluatedOf(opportunity);
    if (!mayFinalizeConsensus(viewer, context)) throw new UnauthorizedException(NOT_PERMITTED_TO_FINALIZE);
    if (opportunity.status !== "EVAL_QUESTIONS_CONSENSUS") throw new BadRequestException([FINALIZE_NOT_AT_CONSENSUS]);
    const program = opportunity.program;
    const questions = questionsOf(opportunity);
    const awaited = await this.awaited(opportunity);
    const consensuses = (await this.store.consensuses(program, { opportunity: opportunity.id })).map((consensus) => ({
      proposal: consensus.proposal.id,
      anonymousProponentName: consensus.proposal.anonymousProponentName,
      status: consensus.status,
      scores: consensus.scores,
    }));
    const outcome = finalizeOutcome(program, questions, awaited, consensuses);
    if (outcome.kind === "refused") throw new BadRequestException([outcome.reason]);
    const finalizing = {
      recorded: outcome.recorded.map((consensus) => ({
        proposal: consensus.proposal,
        note: questionsScoreNote(program, questions.length, consensus.scores),
      })),
      screenedIn: outcome.screenedIn,
    };
    const done = await this.store.finalize(program, opportunity.id, finalizing, (viewer as EvaluationReader).id, this.clock());
    if (!done) throw new BadRequestException([FINALIZE_NOT_AT_CONSENSUS]);
    await this.tell(async () => {
      const people = new Set<string>([
        ...(opportunity.details?.panel ?? []).filter((member) => member.chair).map((member) => member.user.id),
        ...(opportunity.createdBy ? [opportunity.createdBy.id] : []),
      ]);
      const recipients = await Promise.all([...people].map((person) => this.records.recipient(person)));
      const addresses = recipients.filter((person) => person !== null).map((person) => person.email);
      return blindCopiedToStaff(addresses, consensusFinalized(briefOf(opportunity), this.mail.serviceOrigin), this.mail.batchSize);
    });
  }

  // ---------------------------------------------------------------------- checks

  /** Not the chair is not permitted; nor is the chair once the opportunity is not at consensus (design: refused as not permitted). */
  private mustRecord(viewer: EvaluationReader | null, context: EvaluatedOpportunity): void {
    if (!isChairOf(viewer, context)) throw new UnauthorizedException(NOT_THE_CHAIR);
    if (context.status !== "EVAL_QUESTIONS_CONSENSUS") throw new UnauthorizedException(NOT_AT_CONSENSUS);
  }

  /** The proponents still under review of the questions, in anonymous order. */
  private async awaited(opportunity: StoredSummary): Promise<Proponent[]> {
    const proponents = await this.proposals.proponents(opportunity.program, opportunity.id);
    return proponents.filter((proponent) => proponent.status === UNDER_REVIEW_OF_QUESTIONS).sort(byAnonymousName);
  }

  private async locate(program: OtherProgram, proposalId: string): Promise<{ proponent: Proponent; opportunity: StoredSummary }> {
    const proponent = await this.proposals.proponent(program, proposalId.toLowerCase());
    const opportunity = proponent ? await this.opportunities.find(program, proponent.opportunity) : null;
    if (!proponent || !opportunity) throw new NotFoundException(NO_PROPOSAL_THERE);
    return { proponent, opportunity };
  }

  /**
   * Who is told is looked up at the moment of the change, each an active account (R-6.17); they are
   * blind copies of a message visibly addressed to the service alone (R-6.15). A failure to look them up never fails the change (R-6.2).
   */
  private async tell(compose: () => Promise<Envelope[]>): Promise<void> {
    try {
      this.mailer.sendEach(await compose());
    } catch (error: unknown) {
      this.log.error(`The people to tell could not be read: ${error instanceof Error ? error.name : "fault"}.`);
    }
  }
}

const questionsOf = (opportunity: StoredSummary) => opportunity.details?.questions ?? [];

function briefOf(opportunity: StoredSummary): EvaluatedOpportunityInBrief {
  return { program: opportunity.program, id: opportunity.id, title: opportunity.title };
}
