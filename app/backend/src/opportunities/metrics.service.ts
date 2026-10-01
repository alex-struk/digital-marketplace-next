import { Inject, Injectable } from "@nestjs/common";
import { CWU_OPPORTUNITY_STORE, CwuOpportunityStore } from "./cwu-opportunity";
import { OTHER_PROGRAMS_STORE, OtherProgramsStore } from "./other-programs";

/** What has been awarded through the service, as the home page shows it. */
export interface OpportunityMetrics {
  /** How many opportunities have been awarded, in all three programs. */
  readonly totalCount: number;
  /** What they were worth: each Code With Us reward and each other program's budget, in dollars. */
  readonly totalAwarded: number;
}

/** `/api/metrics`: the figures on the home page, answered as a list of one, as the old service did. */
@Injectable()
export class MetricsService {
  constructor(
    @Inject(CWU_OPPORTUNITY_STORE) private readonly codeWithUs: CwuOpportunityStore,
    @Inject(OTHER_PROGRAMS_STORE) private readonly others: OtherProgramsStore,
  ) {}

  async read(): Promise<OpportunityMetrics[]> {
    const [cwu, swu, twu] = await Promise.all([
      this.codeWithUs.list(),
      this.others.list("sprint-with-us"),
      this.others.list("team-with-us"),
    ]);
    const awarded = [
      ...cwu.filter((opportunity) => opportunity.status === "AWARDED").map((opportunity) => opportunity.content.reward),
      ...[...swu, ...twu].filter((opportunity) => opportunity.status === "AWARDED").map((opportunity) => opportunity.budget),
    ];
    return [{ totalCount: awarded.length, totalAwarded: awarded.reduce((sum, value) => sum + value, 0) }];
  }
}
