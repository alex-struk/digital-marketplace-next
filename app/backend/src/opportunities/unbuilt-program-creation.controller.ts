import { Body, Controller, Get, HttpCode, Inject, Param, Post, Req } from "@nestjs/common";
import { IdentifiedRequest } from "../auth/bearer-token";
import { OPPORTUNITY_VIEWERS, OpportunityViewers } from "./cwu-opportunities.controller";
import { SummaryAnswer } from "./other-programs";
import { OtherProgramsService } from "./other-programs.service";

/**
 * Creating and reading one Sprint With Us or Team With Us opportunity before slice 10 (decision
 * records 0030 and 0035). Who may create, and in what state, holds as R-1.7 and R-1.48 say in all
 * three programs; what is accepted is a draft of the fields every program shares. Slice 10
 * replaces this controller with the programs' own.
 */
@Controller("api/opportunities")
export class UnbuiltProgramCreationController {
  constructor(
    private readonly opportunities: OtherProgramsService,
    @Inject(OPPORTUNITY_VIEWERS) private readonly viewers: OpportunityViewers,
  ) {}

  @Post("sprint-with-us")
  @HttpCode(201)
  async createSprintWithUs(@Body() body: unknown, @Req() request: IdentifiedRequest): Promise<SummaryAnswer> {
    return this.opportunities.create(await this.viewers.readingAccount(request.identity), "sprint-with-us", body);
  }

  @Post("team-with-us")
  @HttpCode(201)
  async createTeamWithUs(@Body() body: unknown, @Req() request: IdentifiedRequest): Promise<SummaryAnswer> {
    return this.opportunities.create(await this.viewers.readingAccount(request.identity), "team-with-us", body);
  }

  @Get("sprint-with-us/:id")
  async readSprintWithUs(@Param("id") id: string, @Req() request: IdentifiedRequest): Promise<SummaryAnswer> {
    return this.opportunities.read(await this.viewers.readingAccount(request.identity), "sprint-with-us", id);
  }

  @Get("team-with-us/:id")
  async readTeamWithUs(@Param("id") id: string, @Req() request: IdentifiedRequest): Promise<SummaryAnswer> {
    return this.opportunities.read(await this.viewers.readingAccount(request.identity), "team-with-us", id);
  }
}
