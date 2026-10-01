import { Controller, Get, Query, Req, Res } from "@nestjs/common";
import type { Response } from "express";
import { IdentifiedRequest } from "../auth/bearer-token";
import { contactListCsv, contactListFileName } from "../rules/users";
import { AccountsService } from "./accounts.service";

/**
 * The contact-list export (the contract's exportContactList): the active accounts of the kinds
 * an administrator chose, with the fields they chose, offered as a spreadsheet file to save
 * (R-4.32). Anyone but an administrator is refused before the request is looked at further.
 */
@Controller("api/contact-list")
export class ContactListController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  async export(
    @Query("userTypes") userTypes: unknown,
    @Query("fields") fields: unknown,
    @Req() request: IdentifiedRequest,
    @Res() response: Response,
  ): Promise<void> {
    const viewer = await this.accounts.readingAccount(request.identity);
    const { asked, contacts } = await this.accounts.contactList(viewer, userTypes, fields);
    response
      .status(200)
      .type("text/csv; charset=utf-8")
      .attachment(contactListFileName(new Date()))
      .send(contactListCsv(asked, contacts));
  }
}
