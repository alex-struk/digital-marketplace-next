import { Body, Controller, Delete, Get, Param, Put, Req, Res } from "@nestjs/common";
import type { Response } from "express";
import { IdentifiedRequest } from "../auth/bearer-token";
import { Account } from "./account";
import { AccountsService } from "./accounts.service";
import { SessionEnding } from "./session-ending";

interface TaggedRequestBody {
  readonly tag: string;
  readonly value?: unknown;
}

/** An account just deactivated by its owner, and whether the identity provider's session ended too. */
export interface DeactivatedOwnAccount extends Account {
  readonly identityProviderSignedOut: boolean;
}

@Controller("api/users")
export class UsersController {
  constructor(
    private readonly accounts: AccountsService,
    private readonly ending: SessionEnding,
  ) {}

  /** Somebody's account, for that person or an administrator (R-4.25). */
  @Get(":id")
  async read(@Param("id") id: string, @Req() request: IdentifiedRequest): Promise<Account> {
    const viewer = await this.accounts.actingAccount(request.identity);
    return this.accounts.read(viewer, id);
  }

  /**
   * One change to an account, named by its tag: the profile's details and picture (R-4.27), the
   * capabilities a vendor holds (R-4.8), agreeing to the terms (R-4.3) and the new-opportunity
   * notice choice (R-4.24, R-4.29). The body's shape has already been checked against the
   * contract at the boundary.
   */
  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() body: TaggedRequestBody,
    @Req() request: IdentifiedRequest,
  ): Promise<Account> {
    const actor = await this.accounts.actingAccount(request.identity);
    return this.accounts.changeOwn(actor, id, body.tag, body.value);
  }

  /**
   * Deactivating one's own account (R-4.9). The session the request was made in ends at once,
   * at the service and at the identity provider, so the person is signed out; signing in again
   * is how they come back (R-4.5).
   */
  @Delete(":id")
  async deactivate(
    @Param("id") id: string,
    @Req() request: IdentifiedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<DeactivatedOwnAccount> {
    const actor = await this.accounts.actingAccount(request.identity);
    const account = await this.accounts.deactivateOwn(actor, id);
    const identityProviderSignedOut = await this.ending.end(request, response);
    return { ...account, identityProviderSignedOut };
  }
}
