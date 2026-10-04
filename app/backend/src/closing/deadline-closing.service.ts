import { Inject, Injectable, Logger } from "@nestjs/common";
import { MAIL_SETTINGS, Mailer } from "../mail/mailer";
import { Envelope, addressedToEach } from "../mail/message";
import { readyForEvaluationToAuthor, readyForEvaluationToEvaluators } from "../mail/notifications/closing";
import { MailSettings } from "../mail/settings";
import { CLOCK, Clock } from "../opportunities/cwu-opportunities.service";
import { PROGRAMS, Program } from "../rules/opportunities";
import { CLOSING_INTERVAL, CLOSING_STORE, ClosedOpportunity, ClosingStore } from "./closing";

/**
 * The hook in front of every route under /api and in front of /status that closes the published
 * opportunities whose proposal deadline has passed, in all three programs (R-1.1, decision record
 * 0005). There is no scheduler: ordinary traffic drives it.
 *
 * Each program has its own throttle: a run of its closing work starts at most once per interval,
 * and a request that arrives while one is under way waits for that one rather than starting
 * another. A request waits for the run it started or joined, so whoever triggers a closure and
 * then reads sees it. A failure is the operational log's alone and never fails the request.
 *
 * The messages a closure sends — to a Code With Us opportunity's author, to the evaluators on a
 * Sprint With Us or Team With Us panel (R-1.1, R-5.20) — are composed once the closure is saved and
 * handed to the mail path, never from inside the closing change.
 */
@Injectable()
export class DeadlineClosing {
  private readonly log = new Logger("deadline-closing");
  private readonly started = new Map<Program, number>();
  private readonly running = new Map<Program, Promise<void>>();

  constructor(
    @Inject(CLOSING_STORE) private readonly store: ClosingStore,
    @Inject(CLOSING_INTERVAL) private readonly interval: number,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly mailer: Mailer,
    @Inject(MAIL_SETTINGS) private readonly mail: Pick<MailSettings, "serviceOrigin" | "batchSize">,
  ) {}

  /** Runs whatever closing work is due, in every program, and resolves once it is done. Never rejects. */
  async runDue(): Promise<void> {
    await Promise.all(PROGRAMS.map((program) => this.runFor(program)));
  }

  private runFor(program: Program): Promise<void> {
    const under = this.running.get(program);
    if (under) return under;
    const now = this.clock().getTime();
    const last = this.started.get(program);
    if (last !== undefined && now - last < this.interval) return Promise.resolve();
    this.started.set(program, now);
    const run = this.close(program).finally(() => this.running.delete(program));
    this.running.set(program, run);
    return run;
  }

  /** Closes every lapsed opportunity of one program, each on its own, then tells who is to be told. */
  private async close(program: Program): Promise<void> {
    try {
      const now = this.clock();
      for (const id of await this.store.lapsed(program, now)) {
        const closed = await this.store.close(program, id, now);
        if (closed) this.tell(closed);
      }
    } catch (error) {
      this.log.error(
        JSON.stringify({ event: "closing-failed", program, reason: error instanceof Error ? error.name : "fault" }),
      );
    }
  }

  private tell(closed: ClosedOpportunity): void {
    const origin = this.mail.serviceOrigin;
    const subject = { program: closed.program, id: closed.id, title: closed.title };
    void (async (): Promise<Envelope[]> => {
      if (closed.program === "code-with-us") {
        const [author] = closed.createdBy ? await this.store.addressesOf([closed.createdBy]) : [];
        return author ? [{ to: [author], message: readyForEvaluationToAuthor(subject, origin) }] : [];
      }
      const evaluators = await this.store.addressesOf(closed.evaluators);
      return addressedToEach(evaluators, readyForEvaluationToEvaluators(subject, origin));
    })()
      .then((envelopes) => this.mailer.sendEach(envelopes))
      .catch((error: unknown) =>
        this.log.error(JSON.stringify({ event: "closing-notice-failed", reason: error instanceof Error ? error.name : "fault" })),
      );
  }
}
