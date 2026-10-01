import { Page } from "./page";

/**
 * Pages the service answers for itself when nobody has written one (decision record 0026).
 *
 * There is one: the service level agreement page, which the learn-more screens, the program
 * cards and the three opportunity forms all link to (R-7.18). It is not stored, so it is not one
 * of the twenty-two needed pages a fresh installation lists (R-7.12); its address answers with
 * the same placeholder a stored needed page carries — titled by its address, bodied "Initial
 * version", authored by nobody. The first time an administrator publishes wording for it, it
 * becomes a stored page the service needs, and from then on it is read like any other.
 */

export const SERVICE_LEVEL_AGREEMENT = "service-level-agreement";

const PLACEHOLDER_BODY = "Initial version";

/** Whether a page identifier or address names a built-in page. */
export function isBuiltInAddress(reference: string): boolean {
  return reference === SERVICE_LEVEL_AGREEMENT;
}

/** Whether this page is the service's own answer rather than a stored page. */
export function isBuiltInPage(page: Pick<Page, "id">): boolean {
  return isBuiltInAddress(page.id);
}

/**
 * The built-in page at `address`, dated `since` — when the installation it belongs to was
 * prepared. Its identifier is its address, since it has no stored one.
 */
export function builtInPage(address: string, since: string): Page {
  return {
    id: address,
    createdAt: since,
    updatedAt: since,
    slug: address,
    title: address,
    body: PLACEHOLDER_BODY,
    fixed: true,
  };
}
