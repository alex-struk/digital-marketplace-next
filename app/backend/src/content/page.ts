/**
 * A page of the service's own prose: a title, a body of formatted text and a short address
 * (R-7.1). The body is stored and returned as the marked-up text an administrator typed;
 * turning it into formatted text is the reader's side of the service, and it never executes
 * what it renders (R-7.17).
 */
export interface Page {
  readonly id: string;
  /** When the page was first published (R-7.1). */
  readonly createdAt: string;
  /** When its wording was last changed (R-7.1). */
  readonly updatedAt: string;
  readonly slug: string;
  readonly title: string;
  readonly body: string;
  /** Whether the service needs this page for itself (R-7.25). */
  readonly fixed: boolean;
}

/** A person named as having written a page, linked to their profile on the managing screen. */
export interface Author {
  readonly id: string;
  readonly name: string;
}

/**
 * Who first published a page and who wrote its current wording (R-7.27). Null where no person
 * is recorded, which is every page the service created for itself; the screen names the
 * service ("System") there.
 */
export interface Authorship {
  readonly createdBy: Author | null;
  readonly updatedBy: Author | null;
}

/** A page as an administrator reads it: with its authorship, which nobody else is told. */
export type ManagedPage = Page & Authorship;

/** The wording of a new page or of a new version of one, and who is publishing it. */
export interface PageWording {
  readonly title: string;
  readonly slug: string;
  readonly body: string;
  readonly author: string;
}

/** Another page already holds the address a page was to be published at (R-7.22). */
export class AddressInUse extends Error {
  constructor(readonly slug: string) {
    super(`A page is already held at ${slug}.`);
  }
}

/**
 * Where pages are kept. The service is written against this rather than against Prisma, so the
 * rules about which lookup is tried when, and who may do what, can be tested without a
 * database.
 */
export interface PageStore {
  findByIdentifier(identifier: string): Promise<Page | null>;
  findByAddress(address: string): Promise<Page | null>;
  /** Who first published the page and who wrote its current wording. */
  authorshipOf(pageId: string): Promise<Authorship>;
  /** Every page, at its current wording. */
  list(): Promise<Page[]>;
  /** A new ordinary page with its first version. Throws {@link AddressInUse}. */
  create(wording: PageWording): Promise<Page>;
  /**
   * A new version of a page, kept beside every earlier one (R-7.8), and the page moved to a new
   * address at once when its address changed (R-7.24). Throws {@link AddressInUse}.
   */
  publish(pageId: string, wording: PageWording): Promise<Page>;
  /** The page and every version of it, gone (R-7.9). */
  remove(pageId: string): Promise<void>;
}

export const PAGE_STORE = Symbol("PageStore");
