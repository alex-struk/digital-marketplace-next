import { Body, Controller, Get, HttpCode, Inject, Param, Post, Put, Req } from "@nestjs/common";
import { IdentifiedRequest } from "../auth/bearer-token";
import { OPPORTUNITY_VIEWERS, OpportunityViewers } from "../opportunities/cwu-opportunities.controller";
import type { OtherProgram } from "../rules/other-program-drafts";
import { ConsensusService } from "./consensus.service";
import { EvaluationAnswer } from "./individual-evaluations.service";

type TaggedBody = { tag?: unknown; value?: unknown };

/**
 * The chair's agreed scores for one proponent, at the addresses the contract names for them, and
 * the list of every proponent's (decision record 0063). Submitting the set and finalising it are
 * tagged changes to the opportunity (`submitConsensusQuestionEvaluations`,
 * `finalizeQuestionConsensuses`).
 */
@Controller("api")
export class ConsensusController {
  constructor(
    private readonly consensus: ConsensusService,
    @Inject(OPPORTUNITY_VIEWERS) private readonly viewers: OpportunityViewers,
  ) {}

  @Post("proposal/sprint-with-us/:proposalId/team-questions/consensus")
  @HttpCode(201)
  createSwu(@Param("proposalId") proposalId: string, @Body() body: unknown, @Req() request: IdentifiedRequest): Promise<EvaluationAnswer> {
    return this.create("sprint-with-us", proposalId, body, request);
  }

  @Post("proposal/team-with-us/:proposalId/resource-questions/consensus")
  @HttpCode(201)
  createTwu(@Param("proposalId") proposalId: string, @Body() body: unknown, @Req() request: IdentifiedRequest): Promise<EvaluationAnswer> {
    return this.create("team-with-us", proposalId, body, request);
  }

  @Get("proposal/sprint-with-us/:proposalId/team-questions/consensus/:id")
  readSwu(@Param("proposalId") proposalId: string, @Param("id") id: string, @Req() request: IdentifiedRequest): Promise<EvaluationAnswer> {
    return this.read("sprint-with-us", proposalId, id, request);
  }

  @Get("proposal/team-with-us/:proposalId/resource-questions/consensus/:id")
  readTwu(@Param("proposalId") proposalId: string, @Param("id") id: string, @Req() request: IdentifiedRequest): Promise<EvaluationAnswer> {
    return this.read("team-with-us", proposalId, id, request);
  }

  @Put("proposal/sprint-with-us/:proposalId/team-questions/consensus/:id")
  editSwu(
    @Param("proposalId") proposalId: string,
    @Param("id") id: string,
    @Body() body: TaggedBody,
    @Req() request: IdentifiedRequest,
  ): Promise<EvaluationAnswer> {
    return this.edit("sprint-with-us", proposalId, id, body, request);
  }

  @Put("proposal/team-with-us/:proposalId/resource-questions/consensus/:id")
  editTwu(
    @Param("proposalId") proposalId: string,
    @Param("id") id: string,
    @Body() body: TaggedBody,
    @Req() request: IdentifiedRequest,
  ): Promise<EvaluationAnswer> {
    return this.edit("team-with-us", proposalId, id, body, request);
  }

  @Get("opportunity/sprint-with-us/:opportunityId/team-questions/consensus")
  listSwu(@Param("opportunityId") opportunityId: string, @Req() request: IdentifiedRequest): Promise<EvaluationAnswer[]> {
    return this.list("sprint-with-us", opportunityId, request);
  }

  @Get("opportunity/team-with-us/:opportunityId/resource-questions/consensus")
  listTwu(@Param("opportunityId") opportunityId: string, @Req() request: IdentifiedRequest): Promise<EvaluationAnswer[]> {
    return this.list("team-with-us", opportunityId, request);
  }

  private async create(program: OtherProgram, proposalId: string, body: unknown, request: IdentifiedRequest) {
    return this.consensus.create(await this.viewers.readingAccount(request.identity), program, proposalId, body);
  }

  private async read(program: OtherProgram, proposalId: string, id: string, request: IdentifiedRequest) {
    return this.consensus.read(await this.viewers.readingAccount(request.identity), program, proposalId, id);
  }

  private async edit(program: OtherProgram, proposalId: string, id: string, body: TaggedBody, request: IdentifiedRequest) {
    return this.consensus.edit(await this.viewers.readingAccount(request.identity), program, proposalId, id, body ?? {});
  }

  private async list(program: OtherProgram, opportunityId: string, request: IdentifiedRequest) {
    return this.consensus.listForOpportunity(await this.viewers.readingAccount(request.identity), program, opportunityId);
  }
}
