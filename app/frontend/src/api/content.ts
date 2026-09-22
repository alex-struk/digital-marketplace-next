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
 * Read one page by its address. No session is sent and none is needed: a page is readable by
 * anyone, including a visitor who has not signed in (R-7.1).
 */
export async function fetchPage(address: string): Promise<PageAnswer> {
  const { data, error, response } = await api.GET("/api/content/{id}", {
    params: { path: { id: address } },
  });
  return answerFor(response.status, data ?? error);
}
