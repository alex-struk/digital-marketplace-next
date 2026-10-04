import { Controller, Get, Header, Inject, NotFoundException, Req } from "@nestjs/common";
import { IdentifiedRequest } from "../auth/bearer-token";
import { MAIL_SETTINGS } from "../mail/mailer";
import { MailSettings } from "../mail/settings";
import { mayReadEmailReference } from "../rules/users";
import { AccountsService } from "../users/accounts.service";
import { EmailReference, REFERENCE_NOT_FOUND, emailReference } from "./email-reference";

@Controller("admin")
export class EmailReferenceController {
  constructor(
    private readonly accounts: AccountsService,
    @Inject(MAIL_SETTINGS) private readonly mail: MailSettings,
  ) {}

  /**
   * The notification reference, for an administrator (R-6.13). Anybody else, signed in or not, is
   * answered as though there were nothing here, so the refusal does not reveal the page.
   */
  @Get("email-notification-reference")
  // The page shares this address; neither answer is kept by a browser (decision record 0068).
  @Header("Cache-Control", "no-store")
  async read(@Req() request: IdentifiedRequest): Promise<EmailReference> {
    const account = await this.accounts.readingAccount(request.identity);
    if (!mayReadEmailReference(account)) throw new NotFoundException(REFERENCE_NOT_FOUND);
    return emailReference(this.mail);
  }
}
