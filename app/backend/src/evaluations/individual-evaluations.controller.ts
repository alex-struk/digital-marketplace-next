import { Body, Controller, Get, HttpCode, Inject, Param, Post, Put, Req } from "@nestjs/common";
import { IdentifiedRequest } from "../auth/bearer-token";
import { OPPORTUNITY_VIEWERS, OpportunityViewers } from "../opportunities/cwu-opportunities.controller";
import type { OtherProgram } from "../rules/other-program-drafts";
import { EvaluationAnswer, IndividualEvaluationsService } from "./individual-evaluations.service";

type TaggedBody = { tag?: unknown; value?: unknown };

/**
 * One evaluator's scores for one proponent, at the addresses the contract names for them: Sprint
 * With Us team questions and Team With Us resource questions (decision record 0062). Submitting is
 * not here: the whole set is submitted on the opportunity (`submitIndividualQuestionEvaluations`),
 * and the one tag these addresses take is `edit` (R-5.26). The consensus addresses are the chair's,
 * and belong to the consensus stage.
 */
@Controller("api")
export class IndividualEvaluationsController {
  constructor(
    private readonly evaluations: IndividualEvaluationsService,
    @Inject(OPPORTUNITY_VIEWERS) private readonly viewers: OpportunityViewers,
  ) {}

  @Get("proposal/sprint-with-us/:proposalId/team-questions/evaluations")
  listSwu(@Param("proposalId") proposalId: string, @Req() request: IdentifiedRequest): Promise<EvaluationAnswer[]> {
    return this.listForProposal("sprint-with-us", proposalId, request);
  }

  @Get("proposal/team-with-us/:proposalId/resource-questions/evaluations")
  listTwu(@Param("proposalId") proposalId: string, @Req() request: IdentifiedRequest): Promise<EvaluationAnswer[]> {
    return this.listForProposal("team-with-us", proposalId, request);
  }

  @Post("proposal/sprint-with-us/:proposalId/team-questions/evaluations")
  @HttpCode(201)
  createSwu(@Param("proposalId") proposalId: string, @Body() body: unknown, @Req() request: IdentifiedRequest): Promise<EvaluationAnswer> {
    return this.create("sprint-with-us", proposalId, body, request);
  }

  @Post("proposal/team-with-us/:proposalId/resource-questions/evaluations")
  @HttpCode(201)
  createTwu(@Param("proposalId") proposalId: string, @Body() body: unknown, @Req() request: IdentifiedRequest): Promise<EvaluationAnswer> {
    return this.create("team-with-us", proposalId, body, request);
  }

  @Get("proposal/sprint-with-us/:proposalId/team-questions/evaluations/:id")
  readSwu(@Param("proposalId") proposalId: string, @Param("id") id: string, @Req() request: IdentifiedRequest): Promise<EvaluationAnswer> {
    return this.read("sprint-with-us", proposalId, id, request);
  }

  @Get("proposal/team-with-us/:proposalId/resource-questions/evaluations/:id")
  readTwu(@Param("proposalId") proposalId: string, @Param("id") id: string, @Req() request: IdentifiedRequest): Promise<EvaluationAnswer> {
    return this.read("team-with-us", proposalId, id, request);
  }

  @Put("proposal/sprint-with-us/:proposalId/team-questions/evaluations/:id")
  editSwu(
    @Param("proposalId") proposalId: string,
    @Param("id") id: string,
    @Body() body: TaggedBody,
    @Req() request: IdentifiedRequest,
  ): Promise<EvaluationAnswer> {
    return this.edit("sprint-with-us", proposalId, id, body, request);
  }

  @Put("proposal/team-with-us/:proposalId/resource-questions/evaluations/:id")
  editTwu(
    @Param("proposalId") proposalId: string,
    @Param("id") id: string,
    @Body() body: TaggedBody,
    @Req() request: IdentifiedRequest,
  ): Promise<EvaluationAnswer> {
    return this.edit("team-with-us", proposalId, id, body, request);
  }

  @Get("opportunity/sprint-with-us/:opportunityId/team-questions/evaluations")
  ownSwu(@Param("opportunityId") opportunityId: string, @Req() request: IdentifiedRequest): Promise<EvaluationAnswer[]> {
    return this.listForOpportunity("sprint-with-us", opportunityId, request);
  }

  @Get("opportunity/team-with-us/:opportunityId/resource-questions/evaluations")
  ownTwu(@Param("opportunityId") opportunityId: string, @Req() request: IdentifiedRequest): Promise<EvaluationAnswer[]> {
    return this.listForOpportunity("team-with-us", opportunityId, request);
  }

  private async listForProposal(program: OtherProgram, proposalId: string, request: IdentifiedRequest) {
    return this.evaluations.listForProposal(await this.viewers.readingAccount(request.identity), program, proposalId);
  }

  private async listForOpportunity(program: OtherProgram, opportunityId: string, request: IdentifiedRequest) {
    return this.evaluations.listForOpportunity(await this.viewers.readingAccount(request.identity), program, opportunityId);
  }

  private async create(program: OtherProgram, proposalId: string, body: unknown, request: IdentifiedRequest) {
    return this.evaluations.create(await this.viewers.readingAccount(request.identity), program, proposalId, body);
  }

  private async read(program: OtherProgram, proposalId: string, id: string, request: IdentifiedRequest) {
    return this.evaluations.read(await this.viewers.readingAccount(request.identity), program, proposalId, id);
  }

  private async edit(program: OtherProgram, proposalId: string, id: string, body: TaggedBody, request: IdentifiedRequest) {
    return this.evaluations.edit(await this.viewers.readingAccount(request.identity), program, proposalId, id, body ?? {});
  }
}
