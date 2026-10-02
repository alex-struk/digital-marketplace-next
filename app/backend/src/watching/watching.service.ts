import { Inject, Injectable } from "@nestjs/common";
import { NamedRefusal } from "../common/refusals";
import { OpportunityStanding, OpportunityViewer, Program, mayReadOpportunity } from "../rules/opportunities";
import { WATCH_REFUSALS, WatchRefusal, mayWatch } from "../rules/opportunity-list";
import { WATCH_CLOCK, WATCH_STORE, WatchAnswer, WatchStore } from "./watching";

/**
 * Watching an opportunity and no longer watching it, in all three programs (R-1.5).
 *
 * Anyone signed in may watch an opportunity they may read and did not create, once. Watching is
 * what the messages about an opportunity's addenda and its cancellation go to (slice 9). An
 * opportunity the person may not read is answered as one that is not there (R-1.2). Each refusal
 * is filed under the reason the contract names for it: a second watch under `conflict`.
 */
@Injectable()
export class WatchingService {
  constructor(
    @Inject(WATCH_STORE) private readonly store: WatchStore,
    @Inject(WATCH_CLOCK) private readonly clock: () => Date,
  ) {}

  async watch(viewer: OpportunityViewer | null, program: Program, opportunityId: unknown): Promise<WatchAnswer> {
    if (!viewer) throw refused(WATCH_REFUSALS.signIn, 401);
    const { id, standing } = await this.readable(viewer, program, opportunityId);
    if (!mayWatch(viewer, standing)) throw refused(WATCH_REFUSALS.ownOpportunity);
    const at = this.clock();
    if (!(await this.store.watch(program, id, viewer.id, at))) throw refused(WATCH_REFUSALS.alreadyWatching);
    return { opportunity: { id }, user: { id: viewer.id }, createdAt: at.toISOString() };
  }

  async unwatch(viewer: OpportunityViewer | null, program: Program, opportunityId: unknown): Promise<WatchAnswer> {
    if (!viewer) throw refused(WATCH_REFUSALS.signIn, 401);
    const id = typeof opportunityId === "string" ? opportunityId.toLowerCase() : "";
    if (!(await this.store.unwatch(program, id, viewer.id))) throw refused(WATCH_REFUSALS.notWatching);
    return { opportunity: { id }, user: { id: viewer.id }, createdAt: this.clock().toISOString() };
  }

  /** The opportunities of a program the person watches; nobody's, for a visitor. */
  async watchedBy(viewer: OpportunityViewer | null, program: Program): Promise<ReadonlySet<string>> {
    return viewer ? this.store.watchedBy(program, viewer.id) : new Set();
  }

  private async readable(
    viewer: OpportunityViewer,
    program: Program,
    opportunityId: unknown,
  ): Promise<{ id: string; standing: OpportunityStanding }> {
    const id = typeof opportunityId === "string" ? opportunityId.toLowerCase() : "";
    const standing = id ? await this.store.standing(program, id) : null;
    if (!standing || !mayReadOpportunity(viewer, standing)) throw refused(WATCH_REFUSALS.noSuchOpportunity);
    return { id, standing };
  }
}

/** A refusal under its named reason: 400, or 401 for nobody signed in, as the contract lists them. */
function refused(refusal: WatchRefusal, status = 400): NamedRefusal {
  return new NamedRefusal(status, refusal.reason, [refusal.message]);
}
