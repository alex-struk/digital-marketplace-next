import { Body, Controller, HttpCode, Post, Req } from "@nestjs/common";
import { IdentifiedRequest } from "../auth/bearer-token";
import { AccountsService } from "../users/accounts.service";
import { Announced, TermsAnnouncement } from "./terms-announcement";

@Controller("api/emailNotifications")
export class EmailNotificationsController {
  constructor(
    private readonly accounts: AccountsService,
    private readonly terms: TermsAnnouncement,
  ) {}

  /**
   * The one action this address takes, `updateTerms`: an administrator announcing changed terms
   * (R-6.23). The boundary has already refused any other tag. Anybody else, signed in or not, is
   * refused 400, as the contract says (decision record 0027).
   */
  @Post()
  @HttpCode(200)
  async announce(@Body() _body: { tag: "updateTerms" }, @Req() request: IdentifiedRequest): Promise<Announced> {
    return this.terms.announce(await this.accounts.readingAccount(request.identity));
  }
}
