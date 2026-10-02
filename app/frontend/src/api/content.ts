import { ADDRESS_IN_USE_REFUSAL } from "@rules/content";
import { api } from "./client";

/** A page as a reader sees it (R-7.1). */
export interface Page {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly slug: string;
  readonly title: string;
  readonly body: string;
  readonly fixed: boolean;
}

/**
 * What a request for a page came back with.
 *
 * There are two outcomes on a screen and not three: an address no page holds and an address
 * that is not well formed are different answers from the service (R-7.2, R-7.3), and a
 * person browsing sees the not-found screen for both. A page the app cannot read for any
 * other reason is shown the same way, because the screen exists to show a page's body and
 * has nothing else to show.
 */
export type PageAnswer =
  | { readonly kind: "found"; readonly page: Page }
  | { readonly kind: "missing" };

export function readPage(value: unknown): Page | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const strings = ["id", "createdAt", "updatedAt", "slug", "title", "body"];
  for (const field of strings) {
    if (typeof record[field] !== "string") return null;
  }
  return {
    id: record.id as string,
    createdAt: record.createdAt as string,
    updatedAt: record.updatedAt as string,
    slug: record.slug as string,
    title: record.title as string,
    body: record.body as string,
    fixed: record.fixed === true,
  };
}

export function answerFor(status: number, body: unknown): PageAnswer {
  if (status !== 200) return { kind: "missing" };
  const page = readPage(body);
  return page ? { kind: "found", page } : { kind: "missing" };
}

/**
 * Read one page by its address. A page is readable by anyone, including a visitor who has not
 * signed in (R-7.1).
 */
export async function fetchPage(
  address: string,
  retryDelays: readonly number[] = PAGE_RETRY_DELAYS_MS,
): Promise<PageAnswer> {
  for (let attempt = 0; ; attempt++) {
    let status: number | null = null;
    try {
      const { data, error, response } = await api.GET("/api/content/{id}", {
        params: { path: { id: address } },
      });
      status = response.status;
      // Only a fault or no answer at all is asked again; the service's own answer stands.
      if (status < 500) return answerFor(status, data ?? error);
    } catch {
      // No answer: asked again below.
    }
    const wait = retryDelays[attempt];
    if (wait === undefined) return { kind: "missing" };
    await new Promise<void>((resolve) => setTimeout(resolve, wait));
  }
}

/**
 * How long a page's screen waits before asking again when the service faulted or did not
 * answer, rather than showing the not-found screen for a page that is there (decision record 0039).
 */
export const PAGE_RETRY_DELAYS_MS: readonly number[] = [300, 1000];

// ------------------------------------------------------------------------ managing pages

/** A person named as having written a page (R-7.27). */
export interface Author {
  readonly id: string;
  readonly name: string;
}

/**
 * A page as an administrator reads it: with who first published it and who wrote its current
 * wording, or null where no person is recorded and the service made it (R-7.27).
 */
export interface ManagedPage extends Page {
  readonly createdBy: Author | null;
  readonly updatedBy: Author | null;
}

function readAuthor(value: unknown): Author | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.name === "string"
    ? { id: record.id, name: record.name }
    : null;
}

export function readManagedPage(value: unknown): ManagedPage | null {
  const page = readPage(value);
  if (!page) return null;
  const record = value as Record<string, unknown>;
  return { ...page, createdBy: readAuthor(record.createdBy), updatedBy: readAuthor(record.updatedBy) };
}

function reasonsIn(body: unknown): string[] {
  const errors = (body as { errors?: unknown } | null)?.errors;
  return Array.isArray(errors) ? errors.filter((reason): reason is string => typeof reason === "string") : [];
}

/** What asking for the list of pages came back with. */
export type PageListAnswer =
  | { readonly kind: "listed"; readonly pages: readonly Page[] }
  /** Refused for lack of permission (R-7.16): the screen is the missing page. */
  | { readonly kind: "refused" }
  | { readonly kind: "failed" };

/** Every page, for an administrator (R-7.5). */
export async function fetchPageList(): Promise<PageListAnswer> {
  try {
    const { data, response } = await api.GET("/api/content");
    if (response.status === 401 || response.status === 403) return { kind: "refused" };
    if (!response.ok || !Array.isArray(data)) return { kind: "failed" };
    const pages = (data as unknown[]).map(readPage).filter((page): page is Page => page !== null);
    return { kind: "listed", pages };
  } catch {
    return { kind: "failed" };
  }
}

/** One page with its authorship, for its managing screen (R-7.27). */
export type ManagedPageAnswer =
  | { readonly kind: "found"; readonly page: ManagedPage }
  | { readonly kind: "missing" };

export async function fetchManagedPage(address: string): Promise<ManagedPageAnswer> {
  try {
    const { data, response } = await api.GET("/api/content/{id}", {
      params: { path: { id: address } },
    });
    const page = response.ok ? readManagedPage(data) : null;
    return page ? { kind: "found", page } : { kind: "missing" };
  } catch {
    return { kind: "missing" };
  }
}

/** What publishing a page, or a change to one, came back with. */
export type PublishAnswer =
  | { readonly kind: "published"; readonly page: ManagedPage }
  /** Another page already holds the address (R-7.22). */
  | { readonly kind: "address-in-use" }
  /** The service would not publish it, for the reasons given. */
  | { readonly kind: "refused"; readonly reasons: readonly string[] }
  | { readonly kind: "failed" };

export interface PageWording {
  readonly title: string;
  readonly slug: string;
  readonly body: string;
}

function publishAnswerFor(ok: boolean, data: unknown, error: unknown): PublishAnswer {
  if (ok) {
    const page = readManagedPage(data);
    return page ? { kind: "published", page } : { kind: "failed" };
  }
  const reasons = reasonsIn(error);
  if (reasons.includes(ADDRESS_IN_USE_REFUSAL)) return { kind: "address-in-use" };
  return reasons.length > 0 ? { kind: "refused", reasons } : { kind: "failed" };
}

/** A new page, public at its address as soon as it is published (R-7.7). */
export async function createPage(wording: PageWording): Promise<PublishAnswer> {
  try {
    const { data, error, response } = await api.POST("/api/content", { body: wording });
    return publishAnswerFor(response.ok, data, error);
  } catch {
    return { kind: "failed" };
  }
}

/** A new version of a page, named by its identifier (R-7.8, R-7.24). */
export async function publishChanges(pageId: string, wording: PageWording): Promise<PublishAnswer> {
  try {
    const { data, error, response } = await api.PUT("/api/content/{id}", {
      params: { path: { id: pageId } },
      body: wording,
    });
    return publishAnswerFor(response.ok, data, error);
  } catch {
    return { kind: "failed" };
  }
}

export type RemoveAnswer =
  | { readonly kind: "removed" }
  | { readonly kind: "refused"; readonly reasons: readonly string[] }
  | { readonly kind: "failed" };

/** An ordinary page and every version of it, removed for good (R-7.9). */
export async function removePage(pageId: string): Promise<RemoveAnswer> {
  try {
    const { error, response } = await api.DELETE("/api/content/{id}", {
      params: { path: { id: pageId } },
    });
    if (response.ok) return { kind: "removed" };
    const reasons = reasonsIn(error);
    return reasons.length > 0 ? { kind: "refused", reasons } : { kind: "failed" };
  } catch {
    return { kind: "failed" };
  }
}
