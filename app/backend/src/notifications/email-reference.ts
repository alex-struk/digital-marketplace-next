import { Block } from "../mail/message";
import { referenceGroups } from "../mail/notifications/reference";
import { footerOf, subjectOf } from "../mail/render";
import { MailSettings } from "../mail/settings";

/**
 * What the administrator's notification reference shows (R-6.13, R-6.19): for every message the
 * service can send, its subject as a recipient sees it, the one-line summary of who receives it
 * and why, and its body — the heading, the words and links, and the closing line every message
 * ends with (R-6.6, R-6.16) — each taken from the same rendering the mailer sends.
 */

export interface ReferenceEntry {
  readonly id: string;
  readonly recipient: string;
  readonly subject: string;
  readonly summary?: string;
  readonly title: string;
  readonly body: readonly Block[];
  readonly footer: Block;
}

export interface EmailReference {
  readonly groups: readonly {
    readonly id: string;
    readonly event: string;
    readonly messages: readonly ReferenceEntry[];
  }[];
}

/** The one refusal: the page is not there for anybody but an administrator (R-6.13 note). */
export const REFERENCE_NOT_FOUND = "Not found.";

export function emailReference(
  look: Pick<MailSettings, "serviceOrigin" | "contactEmail" | "testEnvironment">,
): EmailReference {
  return {
    groups: referenceGroups(look).map((group) => ({
      id: group.id,
      event: group.event,
      messages: group.messages.map(({ id, recipient, summary, message }) => ({
        id,
        recipient,
        subject: subjectOf(message, look),
        ...(summary ? { summary } : {}),
        title: message.title,
        body: message.body,
        footer: footerOf(message, look),
      })),
    })),
  };
}
