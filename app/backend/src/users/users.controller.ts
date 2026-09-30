import { Body, Controller, Param, Put, Req } from "@nestjs/common";
import { IdentifiedRequest } from "../auth/bearer-token";
import { Account } from "./account";
import { AccountsService } from "./accounts.service";

interface TaggedRequestBody {
  readonly tag: string;
  readonly value?: unknown;
}

@Controller("api/users")
export class UsersController {
  constructor(private readonly accounts: AccountsService) {}

  /**
   * One change to an account, named by its tag. The changes finishing sign-up needs are here:
   * the profile's details (R-4.27), agreeing to the terms (R-4.3) and the new-opportunity
   * notice choice (R-4.24). The body's shape has already been checked against the contract at
   * the boundary.
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
}
