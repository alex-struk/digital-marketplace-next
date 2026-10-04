import { api } from "./client";

/** A run of words, or a link with its label, as a message is written (backend/src/mail/message.ts). */
export type EmailInline = string | { readonly text: string; readonly href: string };

export type EmailBlock =
  | { readonly kind: "paragraph"; readonly content: readonly EmailInline[] }
  | { readonly kind: "action"; readonly label: string; readonly href: string };

/** One message on the notification reference: who it is for, its subject, summary and body. */
export interface ReferenceMessage {
  readonly id: string;
  readonly recipient: string;
  readonly subject: string;
  readonly summary?: string;
  readonly title: string;
  readonly body: readonly EmailBlock[];
  /** The line every message ends with: Unsubscribe, or the settings link (R-6.6, R-6.16). */
  readonly footer: EmailBlock;
}

export interface ReferenceGroup {
  readonly id: string;
  readonly event: string;
  readonly messages: readonly ReferenceMessage[];
}

/**
 * Every message the service can send, rendered from sample data, for an administrator (R-6.13,
 * R-6.19). Anybody else is answered "not found", which the screen shows as the missing page.
 */
export async function readEmailReference(): Promise<
  { status: "read"; groups: readonly ReferenceGroup[] } | { status: "not-found" } | { status: "failed" }
> {
  try {
    // The page and the samples share one address. A browser that has just loaded the page holds
    // its HTML for that address, and would hand it back here in place of the samples, so this
    // request never reads from or writes to the browser's cache (decision record 0068).
    const { data, response } = await api.GET("/admin/email-notification-reference", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (response.status === 404 || response.status === 401) return { status: "not-found" };
    const groups = (data as { groups?: ReferenceGroup[] } | undefined)?.groups;
    return response.ok && Array.isArray(groups) ? { status: "read", groups } : { status: "failed" };
  } catch {
    return { status: "failed" };
  }
}

/**
 * An administrator announcing that the service's terms and conditions have changed (R-6.23).
 * The service answers once every vendor's acceptance is withdrawn, before any message has been
 * sent (R-6.24), so "announced" says only that; nothing reports how delivery went.
 */
export async function announceUpdatedTerms(): Promise<"announced" | "failed"> {
  try {
    const { response } = await api.POST("/api/emailNotifications", { body: { tag: "updateTerms" } });
    return response.ok ? "announced" : "failed";
  } catch {
    return "failed";
  }
}
