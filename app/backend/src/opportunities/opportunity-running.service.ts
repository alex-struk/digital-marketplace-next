import { BadRequestException, Inject, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { MAIL_SETTINGS, Mailer } from "../mail/mailer";
import { Envelope, blindCopiedBatches } from "../mail/message";
import {
  RunningOpportunity,
  Update,
  cancelledToAuthor,
  opportunityCancelled,
  opportunityUpdated,
} from "../mail/notifications/running-opportunity";
import { DEFAULT_BATCH_SIZE, MailSettings } from "../mail/settings";
import {
  NOT_PERMITTED_TO_ADD_ADDENDUM,
  NOT_PERMITTED_TO_ADD_NOTE,
  ONLY_ADMINISTRATORS_CANCEL,
  OpportunityStatus,
  OpportunityViewer,
  Program,
  addendumProblem,
  cancellationNoteProblem,
  changeIsAnnounced,
  isPermittedTransition,
  mayAddAddendum,
  mayAddNote,
  mayCancelOpportunity,
  mayManageOpportunity,
  maySeeReporting,
  noteProblem,
  transitionRefusal,
} from "../rules/opportunities";
import { Person, Recipient } from "./cwu-opportunity";
import { ATTACHMENT_ACCESS, AttachmentAccess } from "./attachment-access";
import { OPPORTUNITY_RECORDS_STORE, OpportunityRecordsStore, ReportingFigures } from "./opportunity-records";

/** The opportunity an action is taken on: which it is, its state and who created it. */
export interface RunningSubject extends RunningOpportunity {
  readonly status: OpportunityStatus;
  readonly createdBy: string | null;
}

export const NOTES_NOT_KEPT = "That action is not available on this opportunity.";
export const NOTE_ATTACHMENT_NOT_READABLE = "attachments: You may attach only files you are permitted to read.";

/** An addendum as every answer carries it (R-1.32). */
export interface AddendumAnswer {
  readonly id: string;
  readonly createdAt: string;
  readonly createdBy: Person | null;
  readonly description: string;
}

/** One history entry as the author and administrators are answered with it (R-1.30, R-1.33). */
export interface HistoryAnswer {
  readonly createdAt: string;
  readonly createdBy: Person | null;
  readonly status: OpportunityStatus | null;
  readonly event: string | null;
  readonly note: string | null;
  readonly attachments: readonly { readonly id: string; readonly name: string; readonly createdAt: string; readonly fileBlob: string }[];
}

/** What running an opportunity adds to the answer about it. */
export interface RunningAnswer {
  readonly addenda: readonly AddendumAnswer[];
  /** Present only for the author and administrators (R-1.30). */
  readonly history?: readonly HistoryAnswer[];
  /** Present only for the author and administrators, once it has been published (R-1.30). */
  readonly reporting?: ReportingFigures;
}

/**
 * Running an opportunity once it is under way, in any of the three programs: cancelling it
 * (R-1.28), adding an addendum (R-1.32) or a private note with files (R-1.33), the figures and the
 * history reported to its author and administrators (R-1.30), and telling its watchers, proponents
 * and author (R-1.35, R-1.36) — never a deactivated account (R-6.17).
 *
 * Every change of state is checked against the program's path (R-1.20). The messages a change
 * sends go out after the answer, and nothing about them reaches the person who acted (R-6.2).
 */
@Injectable()
export class OpportunityRunningService {
  private readonly log = new Logger(OpportunityRunningService.name);

  constructor(
    @Inject(OPPORTUNITY_RECORDS_STORE) private readonly records: OpportunityRecordsStore,
    @Inject(ATTACHMENT_ACCESS) private readonly files: AttachmentAccess,
    private readonly mailer: Mailer,
    @Inject(MAIL_SETTINGS) private readonly mail: Pick<MailSettings, "serviceOrigin" | "batchSize">,
  ) {}

  /**
   * An administrator cancels an opportunity that is published, at an evaluation stage or in
   * processing, with an optional note; its watchers and proponents are told, and its author
   * separately (R-1.28, R-1.36).
   */
  async cancel(viewer: OpportunityViewer | null, subject: RunningSubject, value: unknown): Promise<void> {
    if (!viewer || !mayCancelOpportunity(viewer)) throw new UnauthorizedException(ONLY_ADMINISTRATORS_CANCEL);
    if (!isPermittedTransition(subject.program, subject.status, "CANCELED")) {
      throw new BadRequestException([transitionRefusal(subject.status, "CANCELED")]);
    }
    const note = textOf(value, "note");
    const problem = cancellationNoteProblem(note);
    if (problem) throw new BadRequestException([`note: ${problem}`]);
    const kept = typeof note === "string" && note.trim() !== "" ? note : null;
    await this.records.changeStatus(subject.program, subject.id, "CANCELED", viewer.id, kept);
    await this.tellOfCancellation(subject);
  }

  /**
   * An addendum, by an administrator or the author, to an opportunity that is no longer a draft;
   * it cannot be removed (R-1.32). Its watchers, proponents and author are told, unless it has been
   * cancelled (R-1.35).
   */
  async addAddendum(viewer: OpportunityViewer | null, subject: RunningSubject, value: unknown): Promise<void> {
    if (!viewer || !mayAddAddendum(viewer, subject)) throw new UnauthorizedException(NOT_PERMITTED_TO_ADD_ADDENDUM);
    const text = textOf(value, "description");
    const problem = addendumProblem(text);
    if (problem) throw new BadRequestException([`addendum: ${problem}`]);
    await this.records.addAddendum(subject.program, subject.id, text as string, viewer.id);
    if (changeIsAnnounced(subject.status)) await this.tellOfUpdate(subject, { kind: "addendum", addendum: text as string });
  }

  /** A private note with files, by an administrator or the author, at any point (R-1.33). */
  async addNote(viewer: OpportunityViewer | null, subject: RunningSubject, value: unknown): Promise<void> {
    if (subject.program === "team-with-us") throw new BadRequestException([NOTES_NOT_KEPT]);
    if (!viewer || !mayAddNote(subject.program, viewer, subject)) throw new UnauthorizedException(NOT_PERMITTED_TO_ADD_NOTE);
    const note = textOf(value, "note");
    const problem = noteProblem(note);
    if (problem) throw new BadRequestException([`note: ${problem}`]);
    const attachments = attachmentIdsOf(value);
    for (const fileId of attachments) {
      if (!(await this.files.mayRead(fileId, viewer))) throw new BadRequestException([NOTE_ATTACHMENT_NOT_READABLE]);
    }
    await this.records.addNote(subject.program, subject.id, note as string, attachments, viewer.id);
  }

  /** An opportunity's details have been changed: its watchers, proponents and author are told (R-1.35). */
  async announceEdit(subject: RunningSubject): Promise<void> {
    if (changeIsAnnounced(subject.status)) await this.tellOfUpdate(subject, { kind: "edited" });
  }

  /**
   * The addenda, to anyone who may read the opportunity; the full history, to its author and
   * administrators; and the reporting figures, to them once it has been published (R-1.30).
   */
  async answerFor(viewer: OpportunityViewer | null, subject: RunningSubject): Promise<RunningAnswer> {
    const manages = mayManageOpportunity(viewer, subject);
    const [addenda, history, reporting] = await Promise.all([
      this.records.addenda(subject.program, subject.id),
      manages ? this.records.history(subject.program, subject.id) : Promise.resolve(null),
      maySeeReporting(viewer, subject) ? this.records.reportingFigures(subject.program, subject.id) : Promise.resolve(null),
    ]);
    return {
      addenda: addenda.map((addendum) => ({
        id: addendum.id,
        createdAt: addendum.createdAt.toISOString(),
        createdBy: addendum.createdBy,
        description: addendum.description,
      })),
      ...(history
        ? {
            history: history.map((entry) => ({
              createdAt: entry.createdAt.toISOString(),
              createdBy: entry.createdBy,
              status: entry.status,
              event: entry.event,
              note: entry.note,
              attachments: entry.attachments,
            })),
          }
        : {}),
      ...(reporting ? { reporting } : {}),
    };
  }

  // ---------------------------------------------------------------------- telling people

  private async tellOfUpdate(subject: RunningSubject, update: Update): Promise<void> {
    const origin = this.mail.serviceOrigin;
    await this.tell(async () => {
      const [watchers, proponents, author] = await Promise.all([
        this.records.watcherRecipients(subject.program, subject.id),
        this.records.proponentRecipients(subject.program, subject.id),
        subject.createdBy ? this.records.recipient(subject.createdBy) : Promise.resolve(null),
      ]);
      // Watchers, proponents and the author are each told once (R-1.35).
      const everyone = onceEach([...watchers, ...proponents, ...(author ? [author] : [])]);
      return this.batches(everyone, opportunityUpdated(subject, update, origin));
    });
  }

  private async tellOfCancellation(subject: RunningSubject): Promise<void> {
    const origin = this.mail.serviceOrigin;
    await this.tell(async () => {
      const [watchers, proponents, author] = await Promise.all([
        this.records.watcherRecipients(subject.program, subject.id),
        this.records.proponentRecipients(subject.program, subject.id),
        subject.createdBy ? this.records.recipient(subject.createdBy) : Promise.resolve(null),
      ]);
      // The author is told separately, so is left out of the notice to everyone else.
      const authorAddress = author?.email?.toLowerCase();
      const others = onceEach([...watchers, ...proponents]).filter(
        (address) => !authorAddress || address?.toLowerCase() !== authorAddress,
      );
      return [
        ...this.batches(others, opportunityCancelled(subject, origin)),
        ...(author ? [cancelledToAuthor(author, subject, origin)] : []),
      ];
    });
  }

  private batches(recipients: readonly (string | null)[], message: Parameters<typeof blindCopiedBatches>[1]): Envelope[] {
    return blindCopiedBatches(recipients, message, this.mail.batchSize ?? DEFAULT_BATCH_SIZE);
  }

  /**
   * Who is to be told is looked up at the moment of the change, before it is answered, so an
   * account deactivated or reactivated a moment later is told according to how it stood then
   * (R-6.17); the messages themselves go after the answer. A failure to look them up is the
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

/** Each address once, ignoring case; recipients with no address keep their place (R-6.28). */
export function onceEach(recipients: readonly Recipient[]): (string | null)[] {
  const seen = new Set<string>();
  const kept: (string | null)[] = [];
  for (const { email } of recipients) {
    if (!email) {
      kept.push(null);
      continue;
    }
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(email);
  }
  return kept;
}

/** The words an action carries: its value itself, or the value's member of that name. */
function textOf(value: unknown, member: string): unknown {
  if (typeof value === "string" || value === undefined || value === null) return value;
  if (typeof value === "object" && !Array.isArray(value)) return (value as Record<string, unknown>)[member];
  return value;
}

/** The files a note names, by identifier or as file records carrying one. */
function attachmentIdsOf(value: unknown): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return [];
  const listed = (value as { attachments?: unknown }).attachments;
  if (!Array.isArray(listed)) return [];
  const ids = listed
    .map((entry) =>
      typeof entry === "string"
        ? entry
        : typeof entry === "object" && entry !== null && typeof (entry as { id?: unknown }).id === "string"
          ? (entry as { id: string }).id
          : null,
    )
    .filter((id): id is string => id !== null)
    .map((id) => id.toLowerCase());
  return [...new Set(ids)];
}
