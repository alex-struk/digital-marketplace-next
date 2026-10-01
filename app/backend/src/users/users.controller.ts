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

  /**
   * Everyone registered, for an administrator only (R-4.14). Anyone else, a visitor included, is
   * refused rather than answered (R-4.21).
   */
  @Get()
  async list(@Req() request: IdentifiedRequest): Promise<Account[]> {
    const viewer = await this.accounts.readingAccount(request.identity);
    return this.accounts.list(viewer);
  }

  /** Somebody's account, for that person or an administrator (R-4.25). */
  @Get(":id")
  async read(@Param("id") id: string, @Req() request: IdentifiedRequest): Promise<Account> {
    const viewer = await this.accounts.actingAccount(request.identity);
    return this.accounts.read(viewer, id);
  }

  /**
   * One change to an account, named by its tag: the profile's details and picture (R-4.27), the
   * capabilities a vendor holds (R-4.8), agreeing to the terms (R-4.3) and the new-opportunity
   * notice choice (R-4.24, R-4.29), each on one's own account; and an administrator's
   * reactivation of an account and granting or withdrawing of administrator rights (R-4.12,
   * R-4.19, R-4.20). The body's shape has already been checked against the contract at the
   * boundary.
   */
  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() body: TaggedRequestBody,
    @Req() request: IdentifiedRequest,
  ): Promise<Account> {
    const actor = await this.accounts.actingAccount(request.identity);
    return this.accounts.change(actor, id, body.tag, body.value);
  }

  /**
   * Deactivating an account. One's own (R-4.9): the session the request was made in ends at
   * once, at the service and at the identity provider, so the person is signed out, and signing
   * in again is how they come back (R-4.5). Somebody else's, by an administrator (R-4.30): the
   * administrator's own session goes on.
   */
  @Delete(":id")
  async deactivate(
    @Param("id") id: string,
    @Req() request: IdentifiedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Account | DeactivatedOwnAccount> {
    const actor = await this.accounts.actingAccount(request.identity);
    const { account, own } = await this.accounts.deactivate(actor, id);
    if (!own) return account;
    const identityProviderSignedOut = await this.ending.end(request, response);
    return { ...account, identityProviderSignedOut };
  }
}
