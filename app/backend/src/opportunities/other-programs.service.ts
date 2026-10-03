import { BadRequestException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { MAIL_SETTINGS, Mailer } from "../mail/mailer";
import { Envelope, Message, blindCopiedBatches } from "../mail/message";
import {
  OtherOpportunityInBrief,
  addedToEvaluationPanel,
  otherOpportunityPublished,
  otherPublishedToAuthor,
  otherSubmittedForReview,
  otherSubmittedForReviewToAuthor,
} from "../mail/notifications/other-program-opportunity";
import { DEFAULT_BATCH_SIZE, MailSettings } from "../mail/settings";
import {
  CalendarDay,
  NOT_PERMITTED_TO_CREATE,
  NOT_PERMITTED_TO_DELETE,
  NOT_PERMITTED_TO_EDIT,
  NOT_PERMITTED_TO_SUBMIT,
  NO_OPPORTUNITY_THERE,
  ONLY_ADMINISTRATORS_PUBLISH,
  OPPORTUNITY_INCOMPLETE,
  OpportunityStatus,
  OpportunityViewer,
  earliestDeadlineFor,
  isPermittedTransition,
  mayDeleteOpportunity,
  mayEditOpportunity,
  mayManageOpportunity,
  mayPublishOpportunity,
  mayReadOpportunity,
  maySeeAuthorship,
  maySubmitForReview,
  pacificDayOf,
  transitionRefusal,
} from "../rules/opportunities";
import {
  NOT_PERMITTED_TO_CHANGE_PANEL,
  PANEL_LOCKED,
  PanelEntryInput,
  PanelMemberCheck,
  isOtherComplete,
  mergedBody,
  newlyAddedMembers,
  otherProblems,
  otherRefusalLine,
  panelMayChange,
  panelProblems,
  readOtherInput,
  readPanel,
} from "../rules/other-program-content";
import {
  OtherProgramDraft,
  PanelMemberDraft,
  ServiceArea,
  UNKNOWN_CREATION_STATE,
  creationDecision,
  draftOf,
  isCreationRefusal,
} from "../rules/other-program-drafts";
import type { AccountKind } from "../rules/users";
import { WatchingService } from "../watching/watching.service";
import { CWU_OPPORTUNITY_STORE, CwuOpportunityStore } from "./cwu-opportunity";
import { CLOCK, Clock } from "./cwu-opportunities.service";
import { OPPORTUNITY_RECORDS_STORE, OpportunityRecordsStore } from "./opportunity-records";
import { OpportunityRunningService, RunningSubject } from "./opportunity-running.service";
import {
  OTHER_PROGRAMS_STORE,
  OtherProgram,
  OtherProgramsStore,
  StoredDetails,
  StoredSummary,
  SummaryAnswer,
} from "./other-programs";

export const NOT_YET_AVAILABLE = "That action is not yet available on this opportunity.";

/**
 * Sprint With Us and Team With Us opportunities (decision record 0045): listing and reading them
 * for whoever may (R-1.2, R-1.3, R-5.18), creating them as a draft, under review or, by an
 * administrator, published (R-1.7, R-1.9, R-1.48), changing their content as a new version
 * (R-1.4, R-1.56), putting them forward for review and publication (R-1.21, R-1.22), deleting a
 * draft or one under review (R-1.53), and setting their evaluation panel while it may still change
 * (R-1.43, R-5.16), telling the people newly put on it (R-5.17). Cancelling, addenda and notes are
 * `OpportunityRunningService`'s, as in every program.
 *
 * A draft is kept with whatever it holds; anything else is judged in full against its program's
 * rules and its panel's, and every problem is named against its field (R-1.10 to R-1.18, R-1.55,
 * R-5.1, R-5.9, R-5.37). Messages go out after the answer, and nothing about them reaches the
 * person who acted (R-6.2).
 */
@Injectable()
export class OtherProgramsService {
  private readonly log = new Logger(OtherProgramsService.name);

  constructor(
    @Inject(OTHER_PROGRAMS_STORE) private readonly store: OtherProgramsStore,
    private readonly watching: WatchingService,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly running: OpportunityRunningService,
    @Inject(OPPORTUNITY_RECORDS_STORE) private readonly records: OpportunityRecordsStore,
    @Inject(CWU_OPPORTUNITY_STORE) private readonly people: Pick<CwuOpportunityStore, "activeAdministrators" | "newOpportunityNoticeRecipients">,
    private readonly mailer: Mailer,
    @Inject(MAIL_SETTINGS) private readonly mail: Pick<MailSettings, "serviceOrigin" | "batchSize">,
  ) {}

  async list(viewer: OpportunityViewer | null, program: OtherProgram): Promise<SummaryAnswer[]> {
    const [all, watched] = await Promise.all([this.store.list(program), this.watching.watchedBy(viewer, program)]);
    return all
      .filter((opportunity) => mayReadOpportunity(viewer, standingOf(opportunity)))
      .map((opportunity) => summaryAnswerFor(opportunity, viewer, watched.has(opportunity.id)));
  }

  /** One opportunity, for someone who may read it; one they may not is answered as one not there (R-1.2). */
  async read(viewer: OpportunityViewer | null, program: OtherProgram, id: string): Promise<SummaryAnswer> {
    const found = await this.readable(viewer, program, id);
    const [watched, running] = await Promise.all([
      this.watching.watchedBy(viewer, program),
      this.running.answerFor(viewer, subjectOf(found)),
    ]);
    return { ...summaryAnswerFor(found, viewer, watched.has(found.id)), ...running };
  }

  async create(viewer: OpportunityViewer | null, program: OtherProgram, body: unknown): Promise<SummaryAnswer> {
    const decision = creationDecision(viewer, body);
    if (isCreationRefusal(decision)) {
      if (decision.kind === "not-permitted") throw new UnauthorizedException(NOT_PERMITTED_TO_CREATE);
      if (decision.kind === "only-administrators-publish") throw new UnauthorizedException(ONLY_ADMINISTRATORS_PUBLISH);
      throw new BadRequestException([UNKNOWN_CREATION_STATE]);
    }
    const author = viewer as OpportunityViewer;
    const today = this.today();
    if (decision !== "DRAFT") {
      const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
      const problems = [
        ...otherProblems(program, readOtherInput(program, body), today),
        ...panelProblems(await this.checked(readPanel(record.evaluationPanel))),
      ];
      if (problems.length > 0) throw new BadRequestException(problems.map(otherRefusalLine));
    }
    const id = await this.store.create(program, draftOf(program, body, today), decision, author.id);
    const created = await this.mustFind(program, id);
    if (decision === "UNDER_REVIEW") await this.tellOfReview(created);
    if (decision === "PUBLISHED") await this.tellOfPublication(created);
    // Everyone on the panel of an opportunity created outside draft has just been added to it (R-5.17).
    if (decision !== "DRAFT") await this.tellPanel(created, panelOf(created).map((member) => member.user));
    return this.read(author, program, id);
  }

  /**
   * One tagged change: an edit, a submission for review, publication, a new evaluation panel, or
   * running the opportunity under way — cancelling it (R-1.28), adding an addendum (R-1.32) or, for
   * Sprint With Us, a private note (R-1.33). Moving it along its evaluation stages is later slices'.
   */
  async change(
    viewer: OpportunityViewer | null,
    program: OtherProgram,
    id: string,
    change: { readonly tag?: unknown; readonly value?: unknown },
  ): Promise<SummaryAnswer> {
    const current = await this.readable(viewer, program, id);
    const subject = subjectOf(current);
    switch (change?.tag) {
      case "edit":
        await this.edit(viewer, current, change.value);
        // A change to an opportunity under way tells its watchers, proponents and author (R-1.35).
        await this.running.announceEdit(subject);
        break;
      case "submitForReview":
        await this.submitForReview(viewer, current);
        break;
      case "publish":
        await this.publish(viewer, current);
        break;
      case "editEvaluationPanel":
        await this.editPanel(viewer, current, change.value);
        break;
      case "cancel":
        await this.running.cancel(viewer, subject, change.value);
        break;
      case "addAddendum":
        await this.running.addAddendum(viewer, subject, change.value);
        break;
      case "addNote":
        await this.running.addNote(viewer, subject, change.value);
        break;
      default:
        throw new BadRequestException([NOT_YET_AVAILABLE]);
    }
    return this.read(viewer, program, subject.id);
  }

  /** Deletes a draft, or an opportunity under review, for those permitted (R-1.53). */
  async remove(viewer: OpportunityViewer | null, program: OtherProgram, id: string): Promise<SummaryAnswer> {
    const current = await this.readable(viewer, program, id);
    if (!mayDeleteOpportunity(viewer, standingOf(current))) throw new UnauthorizedException(NOT_PERMITTED_TO_DELETE);
    const answer = summaryAnswerFor(current, viewer, false);
    await this.store.remove(program, current.id);
    return answer;
  }

  // ---------------------------------------------------------------------- the changes

  /**
   * A new version of the content (R-1.4). What the change leaves out is kept as it was, and the
   * panel is kept whatever the change says: it is changed on its own (R-5.16). Once published, only
   * an administrator may change it (R-1.56).
   */
  private async edit(viewer: OpportunityViewer | null, current: StoredSummary, value: unknown): Promise<void> {
    if (!viewer || !mayEditOpportunity(viewer, standingOf(current))) throw new UnauthorizedException(NOT_PERMITTED_TO_EDIT);
    const program = current.program;
    const kept = draftFromStored(current);
    const merged = mergedBody(program, kept, value);
    const today = this.today();
    const earliest = earliestDeadlineFor(current, today);
    if (current.status !== "DRAFT") {
      const problems = otherProblems(program, readOtherInput(program, merged), earliest);
      if (problems.length > 0) throw new BadRequestException(problems.map(otherRefusalLine));
    }
    const content = { ...draftOf(program, merged, today, earliest), panel: kept.panel };
    await this.store.addVersion(program, current.id, content, kept.panel, viewer.id);
  }

  /** A complete draft goes for review; every administrator and the author are told (R-1.21). */
  private async submitForReview(viewer: OpportunityViewer | null, current: StoredSummary): Promise<void> {
    if (!viewer || !maySubmitForReview(viewer, standingOf(current))) throw new UnauthorizedException(NOT_PERMITTED_TO_SUBMIT);
    this.mustBePermitted(current, "UNDER_REVIEW");
    this.mustBeComplete(current);
    await this.records.changeStatus(current.program, current.id, "UNDER_REVIEW", viewer.id, null);
    await this.tellOfReview(current);
  }

  /** Only an administrator publishes (R-1.22); the moment is recorded by the history (R-1.23). */
  private async publish(viewer: OpportunityViewer | null, current: StoredSummary): Promise<void> {
    if (!viewer || !mayPublishOpportunity(viewer)) throw new UnauthorizedException(ONLY_ADMINISTRATORS_PUBLISH);
    this.mustBePermitted(current, "PUBLISHED");
    this.mustBeComplete(current);
    await this.records.changeStatus(current.program, current.id, "PUBLISHED", viewer.id, null);
    await this.tellOfPublication(current);
  }

  /**
   * A new evaluation panel, from the opportunity's author or an administrator, while it may still
   * change (R-1.43, R-5.16). A panel that breaks a rule is refused, naming it, and the opportunity
   * keeps the panel it had (R-5.1, R-5.9, R-5.37). The change is a new version, so it is in the
   * history as an edit; those newly on the panel are told, unless it is a draft (R-5.17).
   */
  private async editPanel(viewer: OpportunityViewer | null, current: StoredSummary, value: unknown): Promise<void> {
    if (!viewer || !mayManageOpportunity(viewer, standingOf(current))) throw new UnauthorizedException(NOT_PERMITTED_TO_CHANGE_PANEL);
    if (!panelMayChange(current.status)) throw new BadRequestException([PANEL_LOCKED]);
    const entries = readPanel(value);
    const problems = panelProblems(await this.checked(entries));
    if (problems.length > 0) throw new BadRequestException(problems.map(otherRefusalLine));
    const panel: PanelMemberDraft[] = entries.map((entry) => ({ user: entry.user as string, evaluator: entry.evaluator, chair: entry.chair }));
    const kept = draftFromStored(current);
    await this.store.addVersion(current.program, current.id, { ...kept, panel }, panel, viewer.id);
    const before = kept.panel.map((member) => member.user);
    await this.tellPanel(current, newlyAddedMembers(current.status, before, panel.map((member) => member.user)));
  }

  // ---------------------------------------------------------------------- checks

  /** What the service knows of each account a panel names, for judging it. */
  private async checked(entries: readonly PanelEntryInput[]): Promise<PanelMemberCheck[]> {
    const ids = entries.map((entry) => entry.user).filter((user): user is string => user !== null);
    const accounts = new Map((await this.store.accounts([...new Set(ids)])).map((account) => [account.id, account]));
    return entries.map((entry) => {
      const account = entry.user ? accounts.get(entry.user) : undefined;
      return {
        user: entry.user,
        name: account?.name ?? null,
        kind: (account?.type as AccountKind | undefined) ?? null,
        active: account?.status === "ACTIVE",
        evaluator: entry.evaluator,
        chair: entry.chair,
      };
    });
  }

  private mustBePermitted(current: StoredSummary, to: OpportunityStatus): void {
    if (!isPermittedTransition(current.program, current.status, to)) {
      throw new BadRequestException([transitionRefusal(current.status, to)]);
    }
  }

  /** The person is told it is incomplete, not which field (R-1.21). */
  private mustBeComplete(current: StoredSummary): void {
    const kept = draftFromStored(current);
    if (!isOtherComplete(current.program, kept, kept.panel, this.today())) throw new BadRequestException([OPPORTUNITY_INCOMPLETE]);
  }

  private async readable(viewer: OpportunityViewer | null, program: OtherProgram, id: string): Promise<StoredSummary> {
    const found = await this.store.find(program, id.toLowerCase());
    if (!found || !mayReadOther(viewer, found)) throw new NotFoundException(NO_OPPORTUNITY_THERE);
    return found;
  }

  private async mustFind(program: OtherProgram, id: string): Promise<StoredSummary> {
    const found = await this.store.find(program, id);
    if (!found) throw new NotFoundException(NO_OPPORTUNITY_THERE);
    return found;
  }

  private today(): CalendarDay {
    return pacificDayOf(this.clock());
  }

  // ---------------------------------------------------------------------- telling people

  private async tellOfReview(opportunity: StoredSummary): Promise<void> {
    const brief = briefOf(opportunity);
    const origin = this.mail.serviceOrigin;
    await this.tell(async () => {
      const [administrators, author] = await Promise.all([
        this.people.activeAdministrators(),
        opportunity.createdBy ? this.records.recipient(opportunity.createdBy.id) : Promise.resolve(null),
      ]);
      return [
        ...this.batches(administrators.map((person) => person.email), otherSubmittedForReview(brief, origin)),
        ...(author ? [otherSubmittedForReviewToAuthor(author, brief, origin)] : []),
      ];
    });
  }

  private async tellOfPublication(opportunity: StoredSummary): Promise<void> {
    const brief = briefOf(opportunity);
    const origin = this.mail.serviceOrigin;
    await this.tell(async () => {
      const [subscribers, author] = await Promise.all([
        this.people.newOpportunityNoticeRecipients(),
        opportunity.createdBy ? this.records.recipient(opportunity.createdBy.id) : Promise.resolve(null),
      ]);
      return [
        ...this.batches(subscribers.map((person) => person.email), otherOpportunityPublished(brief, origin)),
        ...(author ? [otherPublishedToAuthor(author, brief, origin)] : []),
      ];
    });
  }

  /** The people newly on the panel, each an active account, and nobody else (R-5.17, R-6.17). */
  private async tellPanel(opportunity: StoredSummary, added: readonly string[]): Promise<void> {
    if (added.length === 0) return;
    const brief = briefOf(opportunity);
    const origin = this.mail.serviceOrigin;
    await this.tell(async () => {
      const recipients = await Promise.all(added.map((user) => this.records.recipient(user)));
      const addresses = recipients.filter((person) => person !== null).map((person) => person.email);
      return this.batches(addresses, addedToEvaluationPanel(brief, origin));
    });
  }

  private batches(recipients: readonly (string | null)[], message: Message): Envelope[] {
    return blindCopiedBatches(recipients, message, this.mail.batchSize ?? DEFAULT_BATCH_SIZE);
  }

  /**
   * Who is to be told is looked up at the moment of the change, so an account's standing then
   * decides (R-6.17); the messages go after the answer. A failure to look them up is the
   * operational log's alone and never fails the change (R-6.2).
   */
  private async tell(compose: () => Promise<Envelope[]>): Promise<void> {
    try {
      this.mailer.sendEach(await compose());
    } catch (error: unknown) {
      this.log.error(`The people to tell could not be read: ${error instanceof Error ? error.name : "fault"}.`);
    }
  }
}

// ------------------------------------------------------------------------ reading out

function standingOf(opportunity: StoredSummary) {
  return { status: opportunity.status, createdBy: opportunity.createdBy?.id ?? null };
}

function subjectOf(opportunity: StoredSummary): RunningSubject {
  return { program: opportunity.program, id: opportunity.id, title: opportunity.title, ...standingOf(opportunity) };
}

function briefOf(opportunity: StoredSummary): OtherOpportunityInBrief {
  return {
    program: opportunity.program,
    id: opportunity.id,
    title: opportunity.title,
    budget: opportunity.budget,
    proposalDeadline: opportunity.proposalDeadline,
  };
}

function panelOf(opportunity: StoredSummary): PanelMemberDraft[] {
  return (opportunity.details?.panel ?? []).map((member) => ({ user: member.user.id, evaluator: member.evaluator, chair: member.chair }));
}

const isStaff = (viewer: OpportunityViewer | null) => viewer?.type === "GOV" || viewer?.type === "ADMIN";
const sitsOnPanel = (viewer: OpportunityViewer | null, opportunity: StoredSummary) =>
  viewer !== null && (opportunity.details?.panel ?? []).some((member) => member.user.id === viewer.id);

/**
 * Who reads an opportunity: as in every program (R-1.2, R-1.3), and also a public sector employee
 * on its panel, who sees the panel they sit on (R-5.18).
 */
function mayReadOther(viewer: OpportunityViewer | null, opportunity: StoredSummary): boolean {
  return mayReadOpportunity(viewer, standingOf(opportunity)) || (isStaff(viewer) && sitsOnPanel(viewer, opportunity));
}

/** The panel's membership is answered to an administrator, the author and the panel's members only (R-5.18). */
export function maySeePanel(viewer: OpportunityViewer | null, opportunity: StoredSummary): boolean {
  return mayManageOpportunity(viewer, standingOf(opportunity)) || (isStaff(viewer) && sitsOnPanel(viewer, opportunity));
}

/** What is kept of an opportunity, as its content and panel were last saved. */
export function draftFromStored(opportunity: StoredSummary): OtherProgramDraft {
  const details: StoredDetails = opportunity.details ?? {
    skills: [],
    phases: [],
    questions: [],
    resources: [],
    weights: { questions: 0, codeChallenge: 0, scenario: 0, challenge: 0, price: 0 },
    panel: [],
  };
  return {
    title: opportunity.title,
    teaser: opportunity.teaser,
    remoteOk: opportunity.remoteOk,
    remoteDesc: opportunity.remoteDesc,
    location: opportunity.location,
    budget: opportunity.budget,
    description: opportunity.description,
    proposalDeadline: opportunity.proposalDeadline,
    assignmentDate: opportunity.assignmentDate,
    startDate: opportunity.program === "team-with-us" ? (opportunity.startDate ?? opportunity.assignmentDate) : null,
    completionDate: opportunity.program === "team-with-us" ? opportunity.completionDate : null,
    skills: details.skills,
    phases: details.phases,
    questions: details.questions,
    resources: details.resources.map((resource) => ({ serviceArea: resource.serviceArea as ServiceArea, targetAllocation: resource.targetAllocation })),
    weights: details.weights,
    panel: details.panel.map((member) => ({ user: member.user.id, evaluator: member.evaluator, chair: member.chair })),
  };
}

/**
 * An opportunity as the person asking is answered with it: authorship as R-1.29 allows, and the
 * evaluation panel only to an administrator, the author and the panel's own members (R-5.18).
 */
export function summaryAnswerFor(opportunity: StoredSummary, viewer: OpportunityViewer | null, subscribed: boolean): SummaryAnswer {
  const authorship = maySeeAuthorship(viewer, {
    createdBy: opportunity.createdBy?.id ?? null,
    updatedBy: opportunity.updatedBy?.id ?? null,
  });
  return {
    id: opportunity.id,
    program: opportunity.program,
    createdAt: opportunity.createdAt.toISOString(),
    updatedAt: opportunity.updatedAt.toISOString(),
    ...(authorship ? { createdBy: opportunity.createdBy, updatedBy: opportunity.updatedBy } : {}),
    status: opportunity.status,
    publishedAt: opportunity.publishedAt?.toISOString() ?? null,
    title: opportunity.title,
    teaser: opportunity.teaser,
    location: opportunity.location,
    remoteOk: opportunity.remoteOk,
    remoteDesc: opportunity.remoteDesc,
    description: opportunity.description,
    proposalDeadline: opportunity.proposalDeadline,
    assignmentDate: opportunity.assignmentDate,
    ...(opportunity.program === "sprint-with-us"
      ? { totalMaxBudget: opportunity.budget }
      : { startDate: opportunity.startDate ?? opportunity.assignmentDate, completionDate: opportunity.completionDate, maxBudget: opportunity.budget }),
    subscribed,
    ...(opportunity.details ? programContentOf(opportunity.program, opportunity.details, maySeePanel(viewer, opportunity)) : {}),
  };
}

/** What a program holds, under the names the old service gave it. */
function programContentOf(program: OtherProgram, details: StoredDetails, panelShown: boolean): Partial<SummaryAnswer> {
  const numbered = <T>(items: readonly T[]) => items.map((item, order) => ({ ...item, order }));
  const phase = (kind: string) => details.phases.find((entry) => entry.phase === kind) ?? null;
  const shared = {
    questionsWeight: details.weights.questions,
    priceWeight: details.weights.price,
    ...(panelShown ? { evaluationPanel: numbered(details.panel) } : {}),
  };
  return program === "sprint-with-us"
    ? {
        ...shared,
        mandatorySkills: details.skills,
        inceptionPhase: phase("INCEPTION"),
        prototypePhase: phase("PROTOTYPE"),
        implementationPhase: phase("IMPLEMENTATION"),
        teamQuestions: numbered(details.questions),
        codeChallengeWeight: details.weights.codeChallenge,
        scenarioWeight: details.weights.scenario,
      }
    : {
        ...shared,
        resources: numbered(details.resources),
        resourceQuestions: numbered(details.questions),
        challengeWeight: details.weights.challenge,
      };
}
