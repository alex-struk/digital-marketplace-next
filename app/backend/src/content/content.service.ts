import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { AddressInUse, ManagedPage, PAGE_STORE, Page, PageStore } from "./page";
import { builtInPage, isBuiltInAddress, isBuiltInPage } from "./built-in-pages";
import {
  ADDRESS_IN_USE_REFUSAL,
  NEEDED_PAGE_NOT_REMOVED,
  NEEDED_PAGE_NOT_RENAMED,
  PAGES_ARE_FOR_ADMINISTRATORS,
  PageLookup,
  comparePagesByTitle,
  mayManagePages,
  pageProblems,
  readPageLookup,
  refusalLineFor,
} from "../rules/content";

/** Whoever is asking, as far as pages are concerned: an account's identifier and kind, or nobody. */
export interface PageViewer {
  readonly id: string;
  readonly type: string;
}

/** What a request to create or change a page carries; the boundary has checked its shape. */
export interface PageRequestBody {
  readonly title?: string;
  readonly slug?: string;
  readonly body?: string;
  /** Named by the contract, and ignored: whether the service needs a page is not set here (R-7.25). */
  readonly fixed?: boolean;
}

export const NO_PAGE_THERE = "No page is held at that address.";
export const MALFORMED_PAGE_REFERENCE = "That is not a well-formed page identifier or address.";

@Injectable()
export class ContentService {
  constructor(@Inject(PAGE_STORE) private readonly pages: PageStore) {}

  /**
   * Read one page.
   *
   * The value is read as an identifier first and as an address second (R-7.4), so a page
   * whose address happens to be shaped like an identifier is still reachable by that
   * address. Nothing is checked on the way in: a page is public from the moment it is
   * created (R-7.1).
   */
  async read(lookup: PageLookup): Promise<Page | null> {
    const stored = await this.readStored(lookup);
    if (stored || lookup.kind === "malformed" || !isBuiltInAddress(lookup.value)) return stored;
    // Nobody has written the service level agreement page yet, so the service answers its
    // address itself (R-7.18).
    return builtInPage(lookup.value, await this.installedSince());
  }

  private async readStored(lookup: PageLookup): Promise<Page | null> {
    switch (lookup.kind) {
      case "identifier": {
        const byIdentifier = await this.pages.findByIdentifier(lookup.value);
        if (byIdentifier) return byIdentifier;
        return this.pages.findByAddress(lookup.value);
      }
      case "address":
        return this.pages.findByAddress(lookup.value);
      case "malformed":
        return null;
    }
  }

  /** When the installation was prepared: the earliest of the pages the service needs. */
  private async installedSince(): Promise<string> {
    const needed = (await this.pages.list()).filter((page) => page.fixed).map((page) => page.createdAt);
    return needed.length > 0 ? needed.reduce((a, b) => (a < b ? a : b)) : new Date().toISOString();
  }

  /**
   * One page as the person asking may see it: with who first published it and who wrote its
   * current wording for an administrator, and without for anybody else (R-7.27 note).
   */
  async readFor(viewer: PageViewer | null, lookup: PageLookup): Promise<Page | ManagedPage | null> {
    const page = await this.read(lookup);
    if (!page || !mayManagePages(viewer)) return page;
    return this.managed(page);
  }

  /** Every page, in order of title, for an administrator alone (R-7.5, R-7.16). */
  async list(viewer: PageViewer | null): Promise<Page[]> {
    this.mustManage(viewer);
    return (await this.pages.list()).sort(comparePagesByTitle);
  }

  /**
   * A new ordinary page, public at its address from this moment (R-7.7). It must carry a
   * title, a well-formed address no other page holds, and a body (R-7.20, R-7.21, R-7.22).
   */
  async create(viewer: PageViewer | null, request: PageRequestBody): Promise<ManagedPage> {
    const author = this.mustManage(viewer);
    const wording = {
      title: request.title ?? "",
      slug: request.slug ?? "",
      body: request.body ?? "",
    };
    this.mustBeWellFormed(wording);
    try {
      return await this.managed(await this.pages.create({ ...wording, author }));
    } catch (error) {
      throw this.asRefusal(error);
    }
  }

  /**
   * A new version of a page: readers see it at once, and the wording it replaces is kept as an
   * earlier version (R-7.8). A new address moves the page there at once (R-7.24), except a page
   * the service needs, which keeps its address (R-7.25). An address left out keeps the page
   * where it is.
   */
  async change(
    viewer: PageViewer | null,
    reference: string,
    request: PageRequestBody,
  ): Promise<ManagedPage> {
    const author = this.mustManage(viewer);
    const page = await this.mustFind(reference);
    const wording = {
      title: request.title ?? "",
      slug: request.slug ?? page.slug,
      body: request.body ?? "",
    };
    if (page.fixed && wording.slug !== page.slug) {
      throw new BadRequestException([NEEDED_PAGE_NOT_RENAMED]);
    }
    this.mustBeWellFormed(wording);
    try {
      // A built-in page's first wording makes it a stored page the service needs.
      const published = isBuiltInPage(page)
        ? await this.pages.create({ ...wording, author }, { fixed: true })
        : await this.pages.publish(page.id, { ...wording, author });
      return await this.managed(published);
    } catch (error) {
      throw this.asRefusal(error);
    }
  }

  /**
   * An ordinary page and every version of it, removed for good; its address stops answering
   * (R-7.9). A page the service needs cannot be removed (R-7.25).
   */
  async remove(viewer: PageViewer | null, reference: string): Promise<ManagedPage> {
    this.mustManage(viewer);
    const page = await this.mustFind(reference);
    if (page.fixed) throw new BadRequestException([NEEDED_PAGE_NOT_REMOVED]);
    const removed = await this.managed(page);
    await this.pages.remove(page.id);
    return removed;
  }

  /**
   * Anybody but an administrator is refused before anything else is looked at, whatever the
   * request and whatever page it names, in the one shape every page refusal takes (R-7.10,
   * R-7.16). Returns the administrator's identifier, the author of what they publish.
   */
  private mustManage(viewer: PageViewer | null): string {
    if (!viewer || !mayManagePages(viewer)) {
      throw new UnauthorizedException(PAGES_ARE_FOR_ADMINISTRATORS);
    }
    return viewer.id;
  }

  private async mustFind(reference: string): Promise<Page> {
    const lookup = readPageLookup(reference);
    if (lookup.kind === "malformed") throw new BadRequestException(MALFORMED_PAGE_REFERENCE);
    const page = await this.read(lookup);
    if (!page) throw new NotFoundException(NO_PAGE_THERE);
    return page;
  }

  /** A submission failing any field is refused with every failing field named (R-7.20, R-7.21). */
  private mustBeWellFormed(wording: { title: string; slug: string; body: string }): void {
    const problems = pageProblems(wording);
    if (problems.length > 0) throw new BadRequestException(problems.map(refusalLineFor));
  }

  private asRefusal(error: unknown): unknown {
    return error instanceof AddressInUse ? new BadRequestException([ADDRESS_IN_USE_REFUSAL]) : error;
  }

  private async managed(page: Page): Promise<ManagedPage> {
    // Nobody wrote a built-in page; the screen names the service itself (R-7.27).
    if (isBuiltInPage(page)) return { ...page, createdBy: null, updatedBy: null };
    return { ...page, ...(await this.pages.authorshipOf(page.id)) };
  }
}
