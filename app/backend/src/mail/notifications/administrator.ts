import { Envelope, Inline } from "../message";

/**
 * The messages a person is sent when an administrator deactivates or reactivates their account.
 * Each says that it was an administrator who did it, and whom to write to with questions. A
 * person with no email address known is sent nothing: the mailer skips a recipient without one
 * (R-6.28).
 */

interface Look {
  readonly serviceOrigin: string;
  readonly contactEmail: string;
}

function questions(contactEmail: string): Inline[] {
  return [
    "If you have any questions, please contact the Digital Marketplace team at ",
    { text: contactEmail, href: `mailto:${contactEmail}` },
    ".",
  ];
}

/** Sent when an administrator deactivates somebody's account (R-4.30). */
export function deactivatedByAdministrator(
  person: { readonly email: string | null },
  look: Look,
): Envelope {
  return {
    to: [person.email],
    message: {
      kind: "deactivated-by-administrator",
      subject: "Your Digital Marketplace account has been deactivated",
      title: "Your Digital Marketplace account has been deactivated",
      body: [
        {
          kind: "paragraph",
          content: [
            "An administrator has deactivated your Digital Marketplace account and removed your access to the Digital Marketplace.",
          ],
        },
        { kind: "paragraph", content: questions(look.contactEmail) },
      ],
    },
  };
}

/**
 * Sent when an administrator reactivates an account an administrator deactivated (R-4.20). It
 * says an administrator did it; the message saying the person reactivated it themselves is sent
 * only when they sign in again.
 */
export function reactivatedByAdministrator(
  person: { readonly email: string | null },
  look: Look,
): Envelope {
  return {
    to: [person.email],
    message: {
      kind: "reactivated-by-administrator",
      subject: "Your Digital Marketplace account has been reactivated",
      title: "Your Digital Marketplace account has been reactivated",
      body: [
        {
          kind: "paragraph",
          content: [
            "An administrator has reactivated your Digital Marketplace account. You can sign in again.",
          ],
        },
        { kind: "paragraph", content: questions(look.contactEmail) },
        { kind: "action", label: "Sign in", href: `${look.serviceOrigin}/sign-in` },
      ],
    },
  };
}
