import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  UnauthorizedException,
} from "@nestjs/common";
import { WatchingService } from "../watching/watching.service";
import { MAIL_SETTINGS, Mailer } from "../mail/mailer";
import { Envelope, blindCopiedBatches } from "../mail/message";
import {
  OpportunityInBrief,
  newOpportunityPublished,
  publishedToAuthor,
  submittedForReview,
  submittedForReviewToAuthor,
} from "../mail/notifications/code-with-us-opportunity";
import { DEFAULT_BATCH_SIZE, MailSettings } from "../mail/settings";
import {
  CalendarDay,
  CwuContent,
  CwuInput,
  CwuStatus,
  NOT_PERMITTED_TO_CREATE,
  NOT_PERMITTED_TO_DELETE,
  NOT_PERMITTED_TO_EDIT,
  NOT_PERMITTED_TO_SUBMIT,
  NO_OPPORTUNITY_THERE,
  ONLY_ADMINISTRATORS_PUBLISH,
  OPPORTUNITY_INCOMPLETE,
  OpportunityEvent,
  OpportunityViewer,
  completeCwuContent,
  cwuProblems,
  cwuRefusalLine,
  draftCwuContent,
  earliestDeadlineFor,
  inputFromContent,
  isCwuComplete,
  isPermittedTransition,
  mayCreateInState,
  mayCreateOpportunity,
  mayDeleteOpportunity,
  mayEditOpportunity,
  mayManageOpportunity,
  mayPublishOpportunity,
  mayReadOpportunity,
  maySeeAuthorship,
  maySubmitForReview,
  pacificDayOf,
  readCwuInput,
  transitionRefusal,
} from "../rules/opportunities";
import {
  CWU_OPPORTUNITY_STORE,
  CwuOpportunityAnswer,
  CwuOpportunityStore,
  StoredCwuOpportunity,
} from "./cwu-opportunity";
import { maySeeProposalScores } from "../rules/proposal-evaluation";
import { ATTACHMENT_ACCESS, AttachmentAccess } from "./attachment-access";
import { OpportunityRunningService, RunningAnswer, RunningSubject } from "./opportunity-running.service";

export { ATTACHMENT_ACCESS } from "./attachment-access";
export type { AttachmentAccess } from "./attachment-access";

/** What time it is; a test can stand in for it. */
export const CLOCK = Symbol("Clock");
export type Clock = () => Date;

/** The states an opportunity may be created in (R-1.48). */
const CREATABLE: readonly CwuStatus[] = ["DRAFT", "UNDER_REVIEW", "PUBLISHED"];

export const UNKNOWN_CREATION_STATE =
  "status: An opportunity is created as a draft (DRAFT), under review (UNDER_REVIEW) or published (PUBLISHED).";
export const ATTACHMENT_NOT_READABLE =
  "attachments: You may attach only files you are permitted to read.";
export const ACTION_NOT_AVAILABLE = "That action is not available on this opportunity.";

/** One tagged change to an opportunity, as `updateCodeWithUsOpportunity` carries it. */
export interface TaggedChange {
  readonly tag?: unknown;
  readonly value?: unknown;
}

/**
 * Code With Us opportunities: making them, reading them, changing them, moving them along their
 * path, and deleting them.
 *
 * Every change of content is a new version, recorded in the history as an edit (R-1.4). A draft is
 * saved with whatever it holds (R-1.9); anything that is not a draft is checked in full and each
 * problem named against its field (R-1.10 to R-1.14). A change of state follows the program's path
 * (R-1.20). The messages a change sends go out after the answer, and nothing about them reaches the
 * person who acted (R-6.2).
 */
@Injectable()
export class CwuOpportunitiesService {
  private readonly log = new Logger(CwuOpportunitiesService.name);

  constructor(
    @Inject(CWU_OPPORTUNITY_STORE) private readonly store: CwuOpportunityStore,
    @Inject(ATTACHMENT_ACCESS) private readonly files: AttachmentAccess,
    private readonly mailer: Mailer,
    @Inject(MAIL_SETTINGS) private readonly mail: Pick<MailSettings, "serviceOrigin" | "batchSize">,
    @Inject(CLOCK) private readonly clock: Clock,
    @Optional() private readonly watching?: WatchingService,
    @Optional() private readonly running?: OpportunityRunningService,
  ) {}

  /** Every opportunity the person may read (R-1.2, R-1.3), with whether they watch each (R-1.5). */
  async list(viewer: OpportunityViewer | null): Promise<CwuOpportunityAnswer[]> {
    const [all, watched] = await Promise.all([this.store.list(), this.watchedBy(viewer)]);
    return all
      .filter((opportunity) => mayReadOpportunity(viewer, standingOf(opportunity)))
      .map((opportunity) => answerFor(opportunity, viewer, watched.has(opportunity.id)));
  }

  /**
   * One opportunity, for someone who may read it. One they may not is answered exactly as one
   * that does not exist (R-1.2).
   */
  async read(viewer: OpportunityViewer | null, id: string): Promise<CwuOpportunityAnswer> {
    return this.answer(await this.readable(viewer, id), viewer);
  }

  /** A new opportunity, as a draft, under review or published (R-1.7, R-1.48). */
  async create(viewer: OpportunityViewer | null, body: unknown): Promise<CwuOpportunityAnswer> {
    if (!viewer || !mayCreateOpportunity(viewer)) throw new UnauthorizedException(NOT_PERMITTED_TO_CREATE);
    const requested = (body as { status?: unknown } | null)?.status ?? "DRAFT";
    if (!CREATABLE.includes(requested as CwuStatus)) throw new BadRequestException([UNKNOWN_CREATION_STATE]);
    const status = requested as CwuStatus;
    if (!mayCreateInState(viewer, status)) throw new UnauthorizedException(ONLY_ADMINISTRATORS_PUBLISH);

    const input = readCwuInput(body);
    await this.checkAttachments(viewer, input);
    const today = this.today();
    const content = status === "DRAFT" ? draftCwuContent(input, today) : this.checked(input, today);

    const id = await this.store.create(content, status, viewer.id);
    const created = await this.mustFind(id);
    if (status === "UNDER_REVIEW") this.tellOfReview(created);
    if (status === "PUBLISHED") this.tellOfPublication(created);
    return this.answer(created, viewer);
  }

  /**
   * One tagged change: an edit, a submission for review, publication, cancellation, an addendum
   * or a private note.
   */
  async change(viewer: OpportunityViewer | null, id: string, change: TaggedChange): Promise<CwuOpportunityAnswer> {
    const current = await this.readable(viewer, id);
    switch (change?.tag) {
      case "edit":
        await this.edit(viewer, current, change.value);
        // A change to an opportunity under way tells its watchers, proponents and author (R-1.35).
        await this.running?.announceEdit(subjectOf(current));
        break;
      case "submitForReview":
        await this.submitForReview(viewer, current);
        break;
      case "publish":
        await this.publish(viewer, current);
        break;
      case "cancel":
        await this.mustRun().cancel(viewer, subjectOf(current), change.value);
        break;
      case "addAddendum":
        await this.mustRun().addAddendum(viewer, subjectOf(current), change.value);
        break;
      case "addNote":
        await this.mustRun().addNote(viewer, subjectOf(current), change.value);
        break;
      default:
        throw new BadRequestException([ACTION_NOT_AVAILABLE]);
    }
    return this.answer(await this.mustFind(id), viewer);
  }

  private mustRun(): OpportunityRunningService {
    if (!this.running) throw new BadRequestException([ACTION_NOT_AVAILABLE]);
    return this.running;
  }

  /** Deletes a draft, or an opportunity under review, for those permitted (R-1.53). */
  async remove(viewer: OpportunityViewer | null, id: string): Promise<CwuOpportunityAnswer> {
    const current = await this.readable(viewer, id);
    if (!mayDeleteOpportunity(viewer, standingOf(current))) throw new UnauthorizedException(NOT_PERMITTED_TO_DELETE);
    await this.store.remove(id);
    return answerFor(current, viewer);
  }

  /** One opportunity, with its addenda, and its history and reporting figures as R-1.30 allows. */
  private async answer(opportunity: StoredCwuOpportunity, viewer: OpportunityViewer | null): Promise<CwuOpportunityAnswer> {
    const [watched, running, winner] = await Promise.all([
      this.watchedBy(viewer),
      this.running ? this.running.answerFor(viewer, subjectOf(opportunity)) : Promise.resolve(undefined),
      opportunity.status === "AWARDED" ? this.store.successfulProponent(opportunity.id) : Promise.resolve(null),
    ]);
    const answer = answerFor(opportunity, viewer, watched.has(opportunity.id), running);
    if (!winner) return answer;
    // The winner's name to everyone; their contact details and score only to whoever may see scores (R-1.27).
    const seesScores = maySeeProposalScores(viewer, { createdBy: opportunity.createdBy?.id ?? null });
    return {
      ...answer,
      successfulProponent: seesScores
        ? { name: winner.name, email: winner.email, phone: winner.phone, score: winner.score }
        : { name: winner.name },
    };
  }

  private async watchedBy(viewer: OpportunityViewer | null): Promise<ReadonlySet<string>> {
    return this.watching ? this.watching.watchedBy(viewer, "code-with-us") : new Set();
  }

  // ---------------------------------------------------------------------- the changes

  /**
   * A new version (R-1.4). What the submission leaves out is kept as it was, so a request naming
   * only what changes — an attachment added by its identifier — saves the rest as it stands.
   */
  private async edit(viewer: OpportunityViewer | null, current: StoredCwuOpportunity, value: unknown): Promise<void> {
    if (!viewer || !mayEditOpportunity(viewer, standingOf(current))) throw new UnauthorizedException(NOT_PERMITTED_TO_EDIT);
    const input = mergedInput(current.content, value);
    await this.checkAttachments(viewer, input);
    const today = this.today();
    const content =
      current.status === "DRAFT"
        ? draftCwuContent(input, today)
        : this.checked(input, earliestDeadlineFor({ status: current.status, proposalDeadline: current.content.proposalDeadline }, today));
    await this.store.addVersion(current.id, content, viewer.id);
  }

  /** A complete draft goes for review; every administrator and the author are told (R-1.21, R-1.37). */
  private async submitForReview(viewer: OpportunityViewer | null, current: StoredCwuOpportunity): Promise<void> {
    if (!viewer || !maySubmitForReview(viewer, standingOf(current))) throw new UnauthorizedException(NOT_PERMITTED_TO_SUBMIT);
    this.mustBePermitted(current.status, "UNDER_REVIEW");
    if (!isCwuComplete(current.content, this.today())) throw new BadRequestException([OPPORTUNITY_INCOMPLETE]);
    await this.store.changeStatus(current.id, "UNDER_REVIEW", viewer.id);
    this.tellOfReview(await this.mustFind(current.id));
  }

  /**
   * An administrator publishes; the moment is recorded by the history, and everyone who asked for
   * new-opportunity notices and the author are told (R-1.22, R-1.23, R-1.34).
   */
  private async publish(viewer: OpportunityViewer | null, current: StoredCwuOpportunity): Promise<void> {
    if (!viewer || !mayPublishOpportunity(viewer)) throw new UnauthorizedException(ONLY_ADMINISTRATORS_PUBLISH);
    this.mustBePermitted(current.status, "PUBLISHED");
    if (!isCwuComplete(current.content, this.today())) throw new BadRequestException([OPPORTUNITY_INCOMPLETE]);
    await this.store.changeStatus(current.id, "PUBLISHED", viewer.id);
    this.tellOfPublication(await this.mustFind(current.id));
  }

  // ---------------------------------------------------------------------- checks

  private mustBePermitted(from: CwuStatus, to: CwuStatus): void {
    if (!isPermittedTransition("code-with-us", from, to)) throw new BadRequestException([transitionRefusal(from, to)]);
  }

  /** The content of an opportunity that is not a draft, or a refusal naming every problem. */
  private checked(input: CwuInput, earliestDeadline: CalendarDay): CwuContent {
    const problems = cwuProblems(input, earliestDeadline);
    if (problems.length > 0) throw new BadRequestException(problems.map(cwuRefusalLine));
    return completeCwuContent(input);
  }

  /** Every file named must be one the person may read (R-8.22). */
  private async checkAttachments(viewer: OpportunityViewer, input: CwuInput): Promise<void> {
    for (const fileId of input.attachments) {
      if (!(await this.files.mayRead(fileId, viewer))) throw new BadRequestException([ATTACHMENT_NOT_READABLE]);
    }
  }

  private async readable(viewer: OpportunityViewer | null, id: string): Promise<StoredCwuOpportunity> {
    const found = await this.store.find(id.toLowerCase());
    if (!found || !mayReadOpportunity(viewer, standingOf(found))) throw new NotFoundException(NO_OPPORTUNITY_THERE);
    return found;
  }

  private async mustFind(id: string): Promise<StoredCwuOpportunity> {
    const found = await this.store.find(id);
    if (!found) throw new NotFoundException(NO_OPPORTUNITY_THERE);
    return found;
  }

  private today(): CalendarDay {
    return pacificDayOf(this.clock());
  }

  // ---------------------------------------------------------------------- telling people

  private tellOfReview(opportunity: StoredCwuOpportunity): void {
    const brief = briefOf(opportunity);
    const origin = this.mail.serviceOrigin;
    this.afterwards(async () => {
      const administrators = await this.store.activeAdministrators();
      const author = opportunity.createdBy ? await this.store.recipient(opportunity.createdBy.id) : null;
      return [
        ...this.batches(administrators.map((person) => person.email), submittedForReview(brief, origin)),
        ...(author ? [submittedForReviewToAuthor(author, brief, origin)] : []),
      ];
    });
  }

  private tellOfPublication(opportunity: StoredCwuOpportunity): void {
    const brief = briefOf(opportunity);
    const origin = this.mail.serviceOrigin;
    this.afterwards(async () => {
      const subscribers = await this.store.newOpportunityNoticeRecipients();
      const author = opportunity.createdBy ? await this.store.recipient(opportunity.createdBy.id) : null;
      return [
        ...this.batches(subscribers.map((person) => person.email), newOpportunityPublished(brief, origin)),
        ...(author ? [publishedToAuthor(author, brief, origin)] : []),
      ];
    });
  }

  private batches(recipients: readonly (string | null)[], message: Parameters<typeof blindCopiedBatches>[1]): Envelope[] {
    return blindCopiedBatches(recipients, message, this.mail.batchSize ?? DEFAULT_BATCH_SIZE);
  }

  /**
   * After the answer: who is to be told is looked up and the messages handed to the mailer. A
   * failure here is the operational log's alone (R-6.2).
   */
  private afterwards(compose: () => Promise<Envelope[]>): void {
    setImmediate(() => {
      compose()
        .then((envelopes) => this.mailer.sendEach(envelopes))
        .catch((error: unknown) =>
          this.log.error(`The people to tell could not be read: ${error instanceof Error ? error.name : "fault"}.`),
        );
    });
  }
}

// ------------------------------------------------------------------------ reading out

function standingOf(opportunity: StoredCwuOpportunity) {
  return { status: opportunity.status, createdBy: opportunity.createdBy?.id ?? null };
}

function subjectOf(opportunity: StoredCwuOpportunity): RunningSubject {
  return { program: "code-with-us", id: opportunity.id, title: opportunity.content.title, ...standingOf(opportunity) };
}

function briefOf(opportunity: StoredCwuOpportunity): OpportunityInBrief {
  return {
    id: opportunity.id,
    title: opportunity.content.title,
    reward: opportunity.content.reward,
    proposalDeadline: opportunity.content.proposalDeadline,
  };
}

/** The stored content, overlaid with what a change names; what it leaves out stays as it was. */
export function mergedInput(content: CwuContent, value: unknown): CwuInput {
  const given = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const stored = inputFromContent(content);
  const read = readCwuInput(given);
  const merged: Record<string, unknown> = { ...stored };
  for (const key of Object.keys(stored)) {
    if (key in given) merged[key] = read[key as keyof CwuInput];
  }
  return merged as unknown as CwuInput;
}

/**
 * An opportunity as the person asking is answered with it. Who created and last changed it is
 * named only to an administrator and to those people (R-1.29); the history only to the author and
 * administrators (R-1.30). What running it has gathered — addenda, the history with the files its
 * notes carry, the reporting figures — comes in `running`, already cut to what the person may see;
 * without it, as in a list, the addenda are left out and the history is the stored one.
 */
export function answerFor(
  opportunity: StoredCwuOpportunity,
  viewer: OpportunityViewer | null,
  subscribed = false,
  running?: RunningAnswer,
): CwuOpportunityAnswer {
  const { content } = opportunity;
  const authorship = maySeeAuthorship(viewer, {
    createdBy: opportunity.createdBy?.id ?? null,
    updatedBy: opportunity.updatedBy?.id ?? null,
  });
  const manages = mayManageOpportunity(viewer, standingOf(opportunity));
  return {
    id: opportunity.id,
    program: "code-with-us",
    createdAt: opportunity.createdAt.toISOString(),
    updatedAt: opportunity.updatedAt.toISOString(),
    ...(authorship ? { createdBy: opportunity.createdBy, updatedBy: opportunity.updatedBy } : {}),
    status: opportunity.status,
    publishedAt: opportunity.publishedAt?.toISOString() ?? null,
    title: content.title,
    teaser: content.teaser,
    remoteOk: content.remoteOk,
    remoteDesc: content.remoteDesc,
    location: content.location,
    reward: content.reward,
    skills: content.skills,
    description: content.description,
    proposalDeadline: content.proposalDeadline,
    assignmentDate: content.assignmentDate,
    startDate: content.startDate,
    completionDate: content.completionDate,
    submissionInfo: content.submissionInfo,
    acceptanceCriteria: content.acceptanceCriteria,
    evaluationCriteria: content.evaluationCriteria,
    attachments: opportunity.attachments,
    addenda: running?.addenda ?? [],
    subscribed,
    ...(manages
      ? {
          history: running?.history
            ? running.history.map((entry) => ({
                createdAt: entry.createdAt,
                createdBy: entry.createdBy,
                status: entry.status as CwuStatus | null,
                event: entry.event as OpportunityEvent | null,
                note: entry.note,
                attachments: entry.attachments,
              }))
            : opportunity.history.map((entry) => ({
                createdAt: entry.createdAt.toISOString(),
                createdBy: entry.createdBy,
                status: entry.status,
                event: entry.event,
                note: entry.note,
              })),
        }
      : {}),
    ...(running?.reporting ? { reporting: running.reporting } : {}),
  };
}
