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
