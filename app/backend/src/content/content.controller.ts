import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
} from "@nestjs/common";
import { ContentService } from "./content.service";
import { Page } from "./page";
import { readPageLookup } from "../rules/content";

@Controller("api/content")
export class ContentController {
  constructor(private readonly content: ContentService) {}

  /**
   * Read a page by its identifier or its address. Needs no session: a page is readable by
   * anyone, including a visitor who has not signed in (R-7.1).
   *
   * An address no page holds is answered as not found (R-7.2). A value that is neither a
   * well-formed identifier nor a well-formed address is refused as malformed instead
   * (R-7.3) — a difference only something reading the service's answers directly can see,
   * because the single-page app shows its not-found screen either way.
   */
  @Get(":id")
  async read(@Param("id") id: string): Promise<Page> {
    const lookup = readPageLookup(id);
    if (lookup.kind === "malformed") {
      throw new BadRequestException(
        "That is not a well-formed page identifier or address.",
      );
    }
    const page = await this.content.read(lookup);
    if (!page) {
      throw new NotFoundException("No page is held at that address.");
    }
    return page;
  }
}
