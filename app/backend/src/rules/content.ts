/**
 * Rules about pages, as plain TypeScript.
 *
 * Nothing in this directory imports NestJS, Prisma or Node. The service and the single-page
 * app both call these functions, so the browser and the service can never disagree about a
 * rule (decision record 0001).
 */

/**
 * A page's address is lowercase letters and digits in hyphen-separated groups (R-7.21).
 * No capitals, spaces or underscores, and no hyphen at the start or end.
 */
export const PAGE_ADDRESS_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** The identifier form the service stores a page under. */
const IDENTIFIER_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Whether a value is a well-formed page address (R-7.21). */
export function isPageAddress(value: string): boolean {
  return PAGE_ADDRESS_PATTERN.test(value);
}

/** Whether a value is a well-formed page identifier. */
export function isPageIdentifier(value: string): boolean {
  return IDENTIFIER_PATTERN.test(value);
}

/**
 * How one value in a page request is to be read.
 *
 * A page can be read by its identifier or by its address, and the two lookups are tried in
 * that order, so a page whose address happens to be shaped like an identifier is still
 * reachable by that address (R-7.4). A value that is neither is malformed, and a malformed
 * request is refused rather than answered as not found (R-7.3).
 */
export type PageLookup =
  | { readonly kind: "identifier"; readonly value: string }
  | { readonly kind: "address"; readonly value: string }
  | { readonly kind: "malformed"; readonly value: string };

export function readPageLookup(value: string): PageLookup {
  if (isPageIdentifier(value)) return { kind: "identifier", value };
  if (isPageAddress(value)) return { kind: "address", value };
  return { kind: "malformed", value };
}

// ------------------------------------------------------------------------ who may manage pages

/**
 * Only an administrator may see the list of pages, or create, change or remove a page
 * (R-7.5, R-7.10). Reading one page is anybody's (R-7.1) and is not decided here.
 */
export function mayManagePages(viewer: { readonly type: string } | null | undefined): boolean {
  return viewer?.type === "ADMIN";
}

/**
 * The one refusal every page request made without permission gets — the list, creating,
 * changing and removing alike — so that the refusals can be compared and not merely seen to
 * happen (R-7.16).
 */
export const PAGES_ARE_FOR_ADMINISTRATORS = "Only an administrator may manage pages.";

// ------------------------------------------------------------------------ what a page must carry

export const PAGE_TITLE_MAX_LENGTH = 100;
export const PAGE_BODY_MAX_LENGTH = 50_000;

/** The fields of a page, in the order the form offers them. */
export type PageField = "title" | "slug" | "body";

export const PAGE_FIELD_LABELS: Readonly<Record<PageField, string>> = {
  title: "Title",
  slug: "Address",
  body: "Body",
};

/**
 * Why one field cannot be published as it is. `message` is what the field itself is marked
 * with; `summary` is the shorter wording the list of problems before the publish button uses
 * (design/DESIGN.md, content, "Forms and validation").
 */
export interface PageProblem {
  readonly field: PageField;
  readonly message: string;
  readonly summary: string;
}

const counted = (value: number) => value.toLocaleString("en-US");

/** A title is one to a hundred characters (R-7.20). */
export function titleProblem(title: string): PageProblem | null {
  if (title.trim().length === 0) {
    return { field: "title", message: "Enter a title", summary: "enter a title" };
  }
  if (title.length > PAGE_TITLE_MAX_LENGTH) {
    return {
      field: "title",
      message: `The title is ${counted(title.length)} characters long. Shorten it to ${counted(PAGE_TITLE_MAX_LENGTH)} characters or fewer.`,
      summary: `shorten it to ${counted(PAGE_TITLE_MAX_LENGTH)} characters or fewer`,
    };
  }
  return null;
}

/** An address is lowercase letters and digits in hyphen-separated groups (R-7.21). */
export function slugProblem(slug: string): PageProblem | null {
  if (slug.length === 0) {
    return { field: "slug", message: "Enter an address", summary: "enter an address" };
  }
  if (!isPageAddress(slug)) {
    return {
      field: "slug",
      message: "Use only lowercase letters and numbers joined by single hyphens, like hackathon-rules",
      summary: "use only lowercase letters and numbers joined by single hyphens",
    };
  }
  return null;
}

/** A body is one to fifty thousand characters of formatted text (R-7.20). */
export function bodyProblem(body: string): PageProblem | null {
  if (body.trim().length === 0) {
    return { field: "body", message: "Enter a body", summary: "enter a body" };
  }
  if (body.length > PAGE_BODY_MAX_LENGTH) {
    return {
      field: "body",
      message: `The body is ${counted(body.length)} characters long. Shorten it to ${counted(PAGE_BODY_MAX_LENGTH)} characters or fewer.`,
      summary: `shorten it to ${counted(PAGE_BODY_MAX_LENGTH)} characters or fewer`,
    };
  }
  return null;
}

export interface PageSubmission {
  readonly title: string;
  readonly slug: string;
  readonly body: string;
}

/** Everything wrong with a submission, field by field, in the form's order. */
export function pageProblems(submission: PageSubmission): PageProblem[] {
  return [
    titleProblem(submission.title),
    slugProblem(submission.slug),
    bodyProblem(submission.body),
  ].filter((problem): problem is PageProblem => problem !== null);
}

/**
 * A problem as the service reports it in a refusal: the field named, then the reason, so a
 * refusal read directly says which field failed (R-7.20).
 */
export function refusalLineFor(problem: Pick<PageProblem, "field" | "message">): string {
  return `${PAGE_FIELD_LABELS[problem.field]}: ${problem.message}`;
}

/** What an address another page already holds is marked with (R-7.22). */
export const ADDRESS_IN_USE = "Another page already uses this address. Choose a different one.";

/** The refusal line for an address already in use, which the screens recognise. */
export const ADDRESS_IN_USE_REFUSAL = refusalLineFor({ field: "slug", message: ADDRESS_IN_USE });

/** A page the service needs keeps its address and cannot be removed (R-7.25). */
export const NEEDED_PAGE_NOT_RENAMED = refusalLineFor({
  field: "slug",
  message: "The service needs this page at this address, so the address cannot be changed.",
});
export const NEEDED_PAGE_NOT_REMOVED = "The service needs this page, so it cannot be removed.";

// ------------------------------------------------------------------------ the list's order

/**
 * The list of pages is in order of title (R-7.5), compared as a reader would, so "about" and
 * "About us" sit together; two titles that read the same are put in order of address.
 */
export function comparePagesByTitle(
  a: { readonly title: string; readonly slug: string },
  b: { readonly title: string; readonly slug: string },
): number {
  return a.title.localeCompare(b.title, "en") || a.slug.localeCompare(b.slug, "en");
}

/** The address of the service's own terms and conditions. */
export const TERMS_AND_CONDITIONS_ADDRESS = "terms-and-conditions";

/**
 * Whether a page's managing screen offers the announcement of changed terms to vendors. Only
 * the service's own terms and conditions page does, matched by its address, which the service
 * never lets change (R-7.13, R-7.25). Who may use it is a separate matter: an administrator,
 * as for every managing screen (R-6.23).
 */
export function carriesTermsAnnouncement(slug: string): boolean {
  return slug === TERMS_AND_CONDITIONS_ADDRESS;
}
