import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Param,
  Put,
} from "@nestjs/common";
import { CurrentRequester, Requester, signedInAccount } from "../auth/requester";
import { AccountsService } from "./accounts.service";
import type { User } from "./user";

interface TaggedRequest {
  readonly tag: string;
  readonly value?: unknown;
}

@Controller("api/users")
export class UsersController {
  constructor(private readonly accounts: AccountsService) {}

  /**
   * Change an account by one tagged action (the contract's update route).
   *
   * The actions here are the ones a person takes on their own account while finishing
   * signing up — their details, agreeing to the terms, and the new-opportunity notice choice
   * (R-4.3, R-4.24, R-4.27) — and each is refused on anybody else's account. The actions an
   * administrator takes on somebody else's, and the capabilities, arrive with the slices
   * that build them, and until then are refused as not offered.
   */
  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() body: TaggedRequest,
    @CurrentRequester() requester: Requester,
  ): Promise<User> {
    const account = signedInAccount(requester);
    if (account.id !== id) {
      throw new ForbiddenException("You may change only your own account.");
    }
    switch (body.tag) {
      case "updateProfile":
        return this.accounts.updateProfile(account, body.value);
      case "acceptTerms":
        return this.accounts.acceptTerms(account);
      case "updateNotifications":
        return this.accounts.updateNotifications(account, body.value);
      default:
        throw new BadRequestException("That change is not offered.");
    }
  }
}
