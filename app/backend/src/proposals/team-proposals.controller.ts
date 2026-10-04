import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, Req } from "@nestjs/common";
import { IdentifiedRequest } from "../auth/bearer-token";
import { TeamProgram } from "../rules/team-proposals";
import { AccountsService } from "../users/accounts.service";
import { ProposalAsker, TaggedChange } from "./cwu-proposals.service";
import { TeamProposalAnswer, TeamProposalsService } from "./team-proposals.service";

/**
 * The contract's list, create, read, update and delete of one program's proposals, for Sprint With
 * Us and Team With Us alike. Who may do what is the service's to decide.
 */
abstract class TeamProposalsRoutes {
  protected abstract readonly program: TeamProgram;

  constructor(
    private readonly proposals: TeamProposalsService,
    private readonly accounts: AccountsService,
  ) {}

  @Get()
  async list(@Query("opportunity") opportunity: string | undefined, @Req() request: IdentifiedRequest): Promise<TeamProposalAnswer[]> {
    return this.proposals.list(await this.askerOf(request), this.program, opportunity);
  }

  @Post()
  @HttpCode(201)
  async create(@Body() body: unknown, @Req() request: IdentifiedRequest): Promise<TeamProposalAnswer> {
    return this.proposals.create(await this.askerOf(request), this.program, body ?? {});
  }

  @Get(":id")
  async read(@Param("id") id: string, @Req() request: IdentifiedRequest): Promise<TeamProposalAnswer> {
    return this.proposals.read(await this.askerOf(request), this.program, id);
  }

  @Put(":id")
  async change(@Param("id") id: string, @Body() body: TaggedChange, @Req() request: IdentifiedRequest): Promise<TeamProposalAnswer> {
    return this.proposals.change(await this.askerOf(request), this.program, id, body ?? {});
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @Req() request: IdentifiedRequest): Promise<TeamProposalAnswer> {
    return this.proposals.remove(await this.askerOf(request), this.program, id);
  }

  private askerOf(request: IdentifiedRequest): Promise<ProposalAsker | null> {
    return this.accounts.readingAccount(request.identity);
  }
}

// Each controller declares its own constructor: what Nest injects is read from the class it
// builds, not from the class it extends.

/** `/api/proposals/sprint-with-us` (decision record 0058). */
@Controller("api/proposals/sprint-with-us")
export class SwuProposalsController extends TeamProposalsRoutes {
  protected readonly program = "sprint-with-us" as const;

  constructor(proposals: TeamProposalsService, accounts: AccountsService) {
    super(proposals, accounts);
  }
}

/** `/api/proposals/team-with-us` (decision record 0058). */
@Controller("api/proposals/team-with-us")
export class TwuProposalsController extends TeamProposalsRoutes {
  protected readonly program = "team-with-us" as const;

  constructor(proposals: TeamProposalsService, accounts: AccountsService) {
    super(proposals, accounts);
  }
}
