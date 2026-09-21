import { Inject, Injectable } from "@nestjs/common";
import { PAGE_STORE, Page, PageStore } from "./page";
import { PageLookup } from "../rules/content";

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
}
