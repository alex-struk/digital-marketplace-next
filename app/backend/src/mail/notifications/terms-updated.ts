import { Envelope } from "../message";

/**
 * The programs whose proposals need a current acceptance of the service's terms. The message
 * names every one of them, never a subset (R-6.18).
 */
export const PROGRAMS_NEEDING_CURRENT_TERMS = ["Code With Us", "Sprint With Us", "Team With Us"] as const;

/** "A, B or C". */
function oneOf(names: readonly string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;
}

/**
 * Sent to one active vendor, one message each, when an administrator announces that the
 * service's terms and conditions have changed (R-6.23). It names the change, every program the
 * new terms are needed for (R-6.18), and links to the reader's legal section, where they read
 * and accept them (R-4.16). The new-opportunity notice choice does not govern it, so it offers
 * no way to unsubscribe (R-6.16). A vendor with no email address known is sent nothing: the
 * mailer skips a recipient without one (R-6.28).
 */
export function termsUpdated(
  vendor: { readonly email: string | null },
  serviceOrigin: string,
): Envelope {
  return {
    to: [vendor.email],
    message: {
      kind: "terms-updated",
      subject: "The Digital Marketplace terms and conditions have changed",
      title: "Please review the updated terms and conditions",
      body: [
        {
          kind: "paragraph",
          content: [
            "The Digital Marketplace terms and conditions have been updated. Please sign in to read and accept the new terms.",
          ],
        },
        {
          kind: "paragraph",
          content: [
            `You need to accept the new terms before you can submit proposals to ${oneOf(PROGRAMS_NEEDING_CURRENT_TERMS)}.`,
          ],
        },
        {
          kind: "action",
          label: "Read and accept the new terms",
          href: `${serviceOrigin}/users/me?tab=legal`,
        },
      ],
    },
  };
}
