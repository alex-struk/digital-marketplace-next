import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from "@nestjs/common";
import { IdentifiedRequest } from "../auth/bearer-token";
import { AccountsService } from "../users/accounts.service";
import {
  ListedOrganization,
  OrganizationRecord,
  OrganizationsService,
  OwnMembership,
} from "./organizations.service";

interface TaggedRequestBody {
  readonly tag: string;
  readonly value?: unknown;
}

/**
 * `/api/organizations` and `/api/organizations/<id>`: the public list (R-3.1, R-3.21),
 * registering (R-3.2, R-3.22, R-3.23), reading in full (R-3.3), changing the profile (R-3.18,
 * R-3.19) and archiving (R-3.6, R-3.24). The bodies have already been checked against the
 * contract at the boundary.
 */
@Controller("api/organizations")
export class OrganizationsController {
  constructor(
    private readonly organizations: OrganizationsService,
    private readonly accounts: AccountsService,
  ) {}

  @Get()
  async list(@Req() request: IdentifiedRequest): Promise<ListedOrganization[]> {
    return this.organizations.list(await this.accounts.readingAccount(request.identity));
  }

  @Post()
  async create(@Body() body: Record<string, unknown>, @Req() request: IdentifiedRequest): Promise<OrganizationRecord> {
    return this.organizations.create(await this.accounts.readingAccount(request.identity), body ?? {});
  }

  @Get(":id")
  async read(@Param("id") id: string, @Req() request: IdentifiedRequest): Promise<OrganizationRecord> {
    return this.organizations.read(await this.accounts.readingAccount(request.identity), id);
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() body: TaggedRequestBody,
    @Req() request: IdentifiedRequest,
  ): Promise<OrganizationRecord> {
    const requester = await this.accounts.readingAccount(request.identity);
    return this.organizations.change(requester, id, body.tag, body.value);
  }

  @Delete(":id")
  async archive(@Param("id") id: string, @Req() request: IdentifiedRequest): Promise<OrganizationRecord> {
    const requester = await this.accounts.readingAccount(request.identity);
    return this.organizations.archive(requester, id);
  }
}

/**
 * `/api/ownedOrganizations`: the organizations a signed-in vendor may act for (R-3.15), refused
 * to everybody else (R-3.20).
 */
@Controller("api/ownedOrganizations")
export class OwnedOrganizationsController {
  constructor(
    private readonly organizations: OrganizationsService,
    private readonly accounts: AccountsService,
  ) {}

  @Get()
  async list(@Req() request: IdentifiedRequest): Promise<ListedOrganization[]> {
    return this.organizations.actingFor(await this.accounts.readingAccount(request.identity));
  }
}

/**
 * `/api/affiliations`, as far as it is built: the signed-in person's own memberships, for their
 * organizations section (R-3.6, R-3.23). An organization's team (`?organization=`) and the
 * changes to memberships arrive with the team (slice 12).
 */
@Controller("api/affiliations")
export class AffiliationsController {
  constructor(
    private readonly organizations: OrganizationsService,
    private readonly accounts: AccountsService,
  ) {}

  @Get()
  async list(
    @Query("organization") organization: string | undefined,
    @Req() request: IdentifiedRequest,
  ): Promise<OwnMembership[]> {
    const viewer = await this.accounts.actingAccount(request.identity);
    if (organization !== undefined) {
      throw new BadRequestException("An organization's team cannot be listed here yet.");
    }
    return this.organizations.ownMemberships(viewer);
  }
}
