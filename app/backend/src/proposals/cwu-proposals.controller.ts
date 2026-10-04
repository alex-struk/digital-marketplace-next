import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, Req } from "@nestjs/common";
import { IdentifiedRequest } from "../auth/bearer-token";
import { AccountsService } from "../users/accounts.service";
import { CwuProposalAnswer } from "./cwu-proposal";
import { CwuProposalsService, ProposalAsker, TaggedChange } from "./cwu-proposals.service";

/**
 * `/api/proposals/code-with-us`, the contract's list, create, read, update and delete of Code With
 * Us proposals. Who may do what is the service's to decide, by the asker's account while it is
 * active.
 */
@Controller("api/proposals/code-with-us")
export class CwuProposalsController {
  constructor(
    private readonly proposals: CwuProposalsService,
    private readonly accounts: AccountsService,
  ) {}

  @Get()
  async list(@Query("opportunity") opportunity: string | undefined, @Req() request: IdentifiedRequest): Promise<CwuProposalAnswer[]> {
    return this.proposals.list(await this.askerOf(request), opportunity);
  }

  @Post()
  @HttpCode(201)
  async create(@Body() body: unknown, @Req() request: IdentifiedRequest): Promise<CwuProposalAnswer> {
    return this.proposals.create(await this.askerOf(request), body ?? {});
  }

  @Get(":id")
  async read(@Param("id") id: string, @Req() request: IdentifiedRequest): Promise<CwuProposalAnswer> {
    return this.proposals.read(await this.askerOf(request), id);
  }

  @Put(":id")
  async change(@Param("id") id: string, @Body() body: TaggedChange, @Req() request: IdentifiedRequest): Promise<CwuProposalAnswer> {
    return this.proposals.change(await this.askerOf(request), id, body ?? {});
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @Req() request: IdentifiedRequest): Promise<CwuProposalAnswer> {
    return this.proposals.remove(await this.askerOf(request), id);
  }

  private askerOf(request: IdentifiedRequest): Promise<ProposalAsker | null> {
    return this.accounts.readingAccount(request.identity);
  }
}
