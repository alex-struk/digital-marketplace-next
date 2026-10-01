import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Post, Put, Req } from "@nestjs/common";
import { IdentifiedRequest } from "../auth/bearer-token";
import { Identity } from "../auth/identity";
import { OpportunityViewer } from "../rules/opportunities";
import { CwuOpportunityAnswer } from "./cwu-opportunity";
import { CwuOpportunitiesService, TaggedChange } from "./cwu-opportunities.service";

/** Who a request is from, as far as opportunities are concerned. */
export interface OpportunityViewers {
  readingAccount(identity: Identity | null | undefined): Promise<OpportunityViewer | null>;
}

export const OPPORTUNITY_VIEWERS = Symbol("OpportunityViewers");

/**
 * `/api/opportunities/code-with-us`, the contract's list, create, read, update and delete of Code
 * With Us opportunities. Who may do what is the service's to decide, by the asker's account.
 */
@Controller("api/opportunities/code-with-us")
export class CwuOpportunitiesController {
  constructor(
    private readonly opportunities: CwuOpportunitiesService,
    @Inject(OPPORTUNITY_VIEWERS) private readonly viewers: OpportunityViewers,
  ) {}

  @Get()
  async list(@Req() request: IdentifiedRequest): Promise<CwuOpportunityAnswer[]> {
    return this.opportunities.list(await this.viewerOf(request));
  }

  @Post()
  @HttpCode(201)
  async create(@Body() body: unknown, @Req() request: IdentifiedRequest): Promise<CwuOpportunityAnswer> {
    return this.opportunities.create(await this.viewerOf(request), body ?? {});
  }

  @Get(":id")
  async read(@Param("id") id: string, @Req() request: IdentifiedRequest): Promise<CwuOpportunityAnswer> {
    return this.opportunities.read(await this.viewerOf(request), id);
  }

  @Put(":id")
  async change(
    @Param("id") id: string,
    @Body() body: TaggedChange,
    @Req() request: IdentifiedRequest,
  ): Promise<CwuOpportunityAnswer> {
    return this.opportunities.change(await this.viewerOf(request), id, body ?? {});
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @Req() request: IdentifiedRequest): Promise<CwuOpportunityAnswer> {
    return this.opportunities.remove(await this.viewerOf(request), id);
  }

  private viewerOf(request: IdentifiedRequest): Promise<OpportunityViewer | null> {
    return this.viewers.readingAccount(request.identity);
  }
}
