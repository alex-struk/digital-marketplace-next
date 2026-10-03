import { Controller, Get, Inject, Req } from "@nestjs/common";
import { IdentifiedRequest } from "../auth/bearer-token";
import { OPPORTUNITY_VIEWERS, OpportunityViewers } from "./cwu-opportunities.controller";
import { MetricsService, OpportunityMetrics } from "./metrics.service";
import { SummaryAnswer } from "./other-programs";
import { OtherProgramsService } from "./other-programs.service";

/**
 * The lists of Sprint With Us and Team With Us opportunities, so the opportunity list covers all
 * three programs (R-1.38, R-1.39). One opportunity is `OtherProgramOpportunitiesController`'s.
 */
@Controller("api/opportunities")
export class OtherProgramListsController {
  constructor(
    private readonly opportunities: OtherProgramsService,
    @Inject(OPPORTUNITY_VIEWERS) private readonly viewers: OpportunityViewers,
  ) {}

  @Get("sprint-with-us")
  async listSprintWithUs(@Req() request: IdentifiedRequest): Promise<SummaryAnswer[]> {
    return this.opportunities.list(await this.viewers.readingAccount(request.identity), "sprint-with-us");
  }

  @Get("team-with-us")
  async listTeamWithUs(@Req() request: IdentifiedRequest): Promise<SummaryAnswer[]> {
    return this.opportunities.list(await this.viewers.readingAccount(request.identity), "team-with-us");
  }
}

/** `/api/metrics`: what has been awarded through the service. Anyone may read it. */
@Controller("api/metrics")
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  read(): Promise<OpportunityMetrics[]> {
    return this.metrics.read();
  }
}
