import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Post, Put, Req } from "@nestjs/common";
import { IdentifiedRequest } from "../auth/bearer-token";
import { OPPORTUNITY_VIEWERS, OpportunityViewers } from "./cwu-opportunities.controller";
import { OtherProgram, SummaryAnswer } from "./other-programs";
import { OtherProgramsService } from "./other-programs.service";

type TaggedBody = { tag?: unknown; value?: unknown };

/**
 * Creating, reading, changing and deleting one Sprint With Us or Team With Us opportunity
 * (decision record 0045). `PUT` takes one tagged change: `edit`, `submitForReview`, `publish`,
 * `editEvaluationPanel`, `cancel`, `addAddendum`, `submitIndividualQuestionEvaluations` (an
 * evaluator's whole set of scores, decision record 0062), `submitConsensusQuestionEvaluations` and
 * `finalizeQuestionConsensuses` (the chair's consensus and the one way out of that stage, decision
 * record 0063) and, for Sprint With Us, `addNote`; the stages after the questions are not yet taken.
 */
@Controller("api/opportunities")
export class OtherProgramOpportunitiesController {
  constructor(
    private readonly opportunities: OtherProgramsService,
    @Inject(OPPORTUNITY_VIEWERS) private readonly viewers: OpportunityViewers,
  ) {}

  @Post("sprint-with-us")
  @HttpCode(201)
  createSprintWithUs(@Body() body: unknown, @Req() request: IdentifiedRequest): Promise<SummaryAnswer> {
    return this.create("sprint-with-us", body, request);
  }

  @Post("team-with-us")
  @HttpCode(201)
  createTeamWithUs(@Body() body: unknown, @Req() request: IdentifiedRequest): Promise<SummaryAnswer> {
    return this.create("team-with-us", body, request);
  }

  @Get("sprint-with-us/:id")
  readSprintWithUs(@Param("id") id: string, @Req() request: IdentifiedRequest): Promise<SummaryAnswer> {
    return this.read("sprint-with-us", id, request);
  }

  @Get("team-with-us/:id")
  readTeamWithUs(@Param("id") id: string, @Req() request: IdentifiedRequest): Promise<SummaryAnswer> {
    return this.read("team-with-us", id, request);
  }

  @Put("sprint-with-us/:id")
  changeSprintWithUs(@Param("id") id: string, @Body() body: TaggedBody, @Req() request: IdentifiedRequest): Promise<SummaryAnswer> {
    return this.change("sprint-with-us", id, body, request);
  }

  @Put("team-with-us/:id")
  changeTeamWithUs(@Param("id") id: string, @Body() body: TaggedBody, @Req() request: IdentifiedRequest): Promise<SummaryAnswer> {
    return this.change("team-with-us", id, body, request);
  }

  @Delete("sprint-with-us/:id")
  deleteSprintWithUs(@Param("id") id: string, @Req() request: IdentifiedRequest): Promise<SummaryAnswer> {
    return this.remove("sprint-with-us", id, request);
  }

  @Delete("team-with-us/:id")
  deleteTeamWithUs(@Param("id") id: string, @Req() request: IdentifiedRequest): Promise<SummaryAnswer> {
    return this.remove("team-with-us", id, request);
  }

  private async create(program: OtherProgram, body: unknown, request: IdentifiedRequest): Promise<SummaryAnswer> {
    return this.opportunities.create(await this.viewers.readingAccount(request.identity), program, body);
  }

  private async read(program: OtherProgram, id: string, request: IdentifiedRequest): Promise<SummaryAnswer> {
    return this.opportunities.read(await this.viewers.readingAccount(request.identity), program, id);
  }

  private async change(program: OtherProgram, id: string, body: TaggedBody, request: IdentifiedRequest): Promise<SummaryAnswer> {
    return this.opportunities.change(await this.viewers.readingAccount(request.identity), program, id, body ?? {});
  }

  private async remove(program: OtherProgram, id: string, request: IdentifiedRequest): Promise<SummaryAnswer> {
    return this.opportunities.remove(await this.viewers.readingAccount(request.identity), program, id);
  }
}
