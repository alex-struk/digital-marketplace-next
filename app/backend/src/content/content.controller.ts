import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
} from "@nestjs/common";
import { IdentifiedRequest } from "../auth/bearer-token";
import { Identity } from "../auth/identity";
import { AccountsService } from "../users/accounts.service";
import {
  ContentService,
  MALFORMED_PAGE_REFERENCE,
  NO_PAGE_THERE,
  PageRequestBody,
  PageViewer,
} from "./content.service";
import { ManagedPage, Page } from "./page";
import { readPageLookup } from "../rules/content";

/** Who a request is from, as far as pages are concerned. */
export interface PageViewers {
  readingAccount(identity: Identity | null | undefined): Promise<PageViewer | null>;
}

export const PAGE_VIEWERS = Symbol("PageViewers");

@Controller("api/content")
export class ContentController {
  constructor(
    private readonly content: ContentService,
    @Inject(PAGE_VIEWERS) private readonly viewers: PageViewers,
  ) {}

  /** Every page, in order of title, for an administrator alone (R-7.5, R-7.16). */
  @Get()
  async list(@Req() request: IdentifiedRequest): Promise<Page[]> {
    return this.content.list(await this.viewerOf(request));
  }

  /** A new page, public at its address at once (R-7.7). */
  @Post()
  @HttpCode(201)
  async create(
    @Body() body: PageRequestBody,
    @Req() request: IdentifiedRequest,
  ): Promise<ManagedPage> {
    return this.content.create(await this.viewerOf(request), body ?? {});
  }

  /**
   * Read a page by its identifier or its address. Needs no session: a page is readable by
   * anyone, including a visitor who has not signed in (R-7.1). An administrator is also told
   * who first published it and who last changed it (R-7.27).
   *
   * An address no page holds is answered as not found (R-7.2). A value that is neither a
   * well-formed identifier nor a well-formed address is refused as malformed instead
   * (R-7.3) — a difference only something reading the service's answers directly can see,
   * because the single-page app shows its not-found screen either way.
   */
  @Get(":id")
  async read(@Param("id") id: string, @Req() request?: IdentifiedRequest): Promise<Page> {
    const lookup = readPageLookup(id);
    if (lookup.kind === "malformed") {
      throw new BadRequestException(MALFORMED_PAGE_REFERENCE);
    }
    const page = await this.content.readFor(await this.viewerOf(request), lookup);
    if (!page) {
      throw new NotFoundException(NO_PAGE_THERE);
    }
    return page;
  }

  /**
   * Publish a new version of a page, named by its identifier or its address (R-7.8, R-7.24,
   * R-7.25).
   */
  @Put(":id")
  async change(
    @Param("id") id: string,
    @Body() body: PageRequestBody,
    @Req() request: IdentifiedRequest,
  ): Promise<ManagedPage> {
    return this.content.change(await this.viewerOf(request), id, body ?? {});
  }

  /** Remove an ordinary page and every version of it (R-7.9, R-7.25). */
  @Delete(":id")
  async remove(@Param("id") id: string, @Req() request: IdentifiedRequest): Promise<ManagedPage> {
    return this.content.remove(await this.viewerOf(request), id);
  }

  private viewerOf(request: IdentifiedRequest | undefined): Promise<PageViewer | null> {
    return this.viewers.readingAccount(request?.identity);
  }
}
