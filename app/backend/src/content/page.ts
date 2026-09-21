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

/**
 * Where pages are read from. The service is written against this rather than against Prisma,
 * so the rules about which lookup is tried when can be tested without a database.
 */
export interface PageStore {
  findByIdentifier(identifier: string): Promise<Page | null>;
  findByAddress(address: string): Promise<Page | null>;
}

export const PAGE_STORE = Symbol("PageStore");
