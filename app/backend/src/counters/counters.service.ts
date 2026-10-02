import { BadRequestException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import {
  NOT_PERMITTED_TO_READ_COUNTERS,
  OpportunityViewer,
  mayReadCounters,
  mayReadOpportunity,
} from "../rules/opportunities";
import { CounterAddress, counterName, readCounterName } from "../rules/opportunity-list";
import { WATCH_STORE, WatchStore } from "../watching/watching";
import { COUNTER_STORE, CounterStore, Counts } from "./counters";

export const NOT_A_COUNTER = (name: string) =>
  `counters: "${name}" is not a counter. A counter is named opportunity.<program>.<opportunity id>.<views or watchers>.`;
export const ONLY_VIEWS_COUNTED = "Only the views of an opportunity's public page are counted here.";
export const NOTHING_TO_COUNT = "counters: No opportunity you may read is held at that identifier.";

/**
 * The counts behind an opportunity's reporting figures (observables: counters): how often its
 * public page has been opened (R-1.6), and how many people watch it (R-1.5).
 *
 * Opening the public page adds a view, for anyone, signed in or not. The counts are read by name
 * only by public sector staff and administrators; a vendor or a visitor is refused (R-1.30,
 * decision record 0043, which replaces decision record 0034's reading by anyone).
 */
@Injectable()
export class CountersService {
  constructor(
    @Inject(COUNTER_STORE) private readonly counters: CounterStore,
    @Inject(WATCH_STORE) private readonly watches: WatchStore,
  ) {}

  async read(viewer: OpportunityViewer | null, names: readonly string[]): Promise<Counts> {
    if (!mayReadCounters(viewer)) throw new UnauthorizedException(NOT_PERMITTED_TO_READ_COUNTERS);
    const addressed = names.map((name) => [name, readCounterName(name)] as const);
    const unknown = addressed.find(([, address]) => address === null);
    if (unknown) throw new BadRequestException([NOT_A_COUNTER(unknown[0])]);

    const views = await this.counters.read(addressed.map(([, address]) => viewName(address!)));
    const counts: Record<string, number> = {};
    for (const [name, address] of addressed) {
      counts[name] =
        address!.kind === "watchers"
          ? await this.watches.watcherCount(address!.program, address!.opportunityId)
          : (views.get(viewName(address!)) ?? 0);
    }
    return counts;
  }

  /** One more view of an opportunity's public page, by someone who may read it (R-1.6). */
  async increment(viewer: OpportunityViewer | null, name: string): Promise<Counts> {
    const address = readCounterName(name);
    if (!address) throw new BadRequestException([NOT_A_COUNTER(name)]);
    if (address.kind !== "views") throw new BadRequestException([ONLY_VIEWS_COUNTED]);
    const standing = await this.watches.standing(address.program, address.opportunityId);
    if (!standing || !mayReadOpportunity(viewer, standing)) throw new BadRequestException([NOTHING_TO_COUNT]);
    return { [name]: await this.counters.increment(viewName(address)) };
  }
}

/** Where a view count is kept: its name, with the identifier written one way. */
function viewName(address: CounterAddress): string {
  return counterName(address.program, address.opportunityId, "views");
}
