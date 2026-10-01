import { BadRequestException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { OpportunityStanding, OpportunityViewer, Program, mayReadOpportunity } from "../rules/opportunities";
import {
  ALREADY_WATCHING,
  NOT_WATCHING,
  NOT_YOUR_OWN,
  NO_SUCH_OPPORTUNITY,
  SIGN_IN_TO_WATCH,
  mayWatch,
} from "../rules/opportunity-list";
import { WATCH_CLOCK, WATCH_STORE, WatchAnswer, WatchStore } from "./watching";

/**
 * Watching an opportunity and no longer watching it, in all three programs (R-1.5).
 *
 * Anyone signed in may watch an opportunity they may read and did not create, once. Watching is
 * what the messages about an opportunity's addenda and its cancellation go to (slice 9). An
 * opportunity the person may not read is answered as one that is not there (R-1.2).
 */
@Injectable()
export class WatchingService {
  constructor(
    @Inject(WATCH_STORE) private readonly store: WatchStore,
    @Inject(WATCH_CLOCK) private readonly clock: () => Date,
  ) {}

  async watch(viewer: OpportunityViewer | null, program: Program, opportunityId: unknown): Promise<WatchAnswer> {
    if (!viewer) throw new UnauthorizedException(SIGN_IN_TO_WATCH);
    const { id, standing } = await this.readable(viewer, program, opportunityId);
    if (!mayWatch(viewer, standing)) throw new BadRequestException([NOT_YOUR_OWN]);
    const at = this.clock();
    if (!(await this.store.watch(program, id, viewer.id, at))) throw new BadRequestException([ALREADY_WATCHING]);
    return { opportunity: { id }, user: { id: viewer.id }, createdAt: at.toISOString() };
  }

  async unwatch(viewer: OpportunityViewer | null, program: Program, opportunityId: unknown): Promise<WatchAnswer> {
    if (!viewer) throw new UnauthorizedException(SIGN_IN_TO_WATCH);
    const id = typeof opportunityId === "string" ? opportunityId.toLowerCase() : "";
    if (!(await this.store.unwatch(program, id, viewer.id))) throw new BadRequestException([NOT_WATCHING]);
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
    if (!standing || !mayReadOpportunity(viewer, standing)) throw new BadRequestException([NO_SUCH_OPPORTUNITY]);
    return { id, standing };
  }
}
