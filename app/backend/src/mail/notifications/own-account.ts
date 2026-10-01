import { Envelope } from "../message";

/**
 * The messages a person is sent about deactivating their own account and coming back to it.
 * A person with no email address known is sent nothing: the mailer skips a recipient without
 * one (R-6.28).
 */

/**
 * Sent when a person deactivates their own account, telling them that signing in again is how
 * to come back (R-4.9, R-4.5).
 */
export function deactivatedOwnAccount(
  person: { readonly email: string | null },
  serviceOrigin: string,
): Envelope {
  return {
    to: [person.email],
    message: {
      kind: "deactivated-own-account",
      subject: "Your Digital Marketplace account has been deactivated",
      title: "Your Digital Marketplace account has been deactivated",
      body: [
        {
          kind: "paragraph",
          content: ["You have deactivated your Digital Marketplace account and have been signed out."],
        },
        {
          kind: "paragraph",
          content: [
            "Your account has been kept. You can reactivate it at any time by signing in again.",
          ],
        },
        { kind: "action", label: "Sign in", href: `${serviceOrigin}/sign-in` },
      ],
    },
  };
}

/**
 * Sent when a person who deactivated their own account signs in again and it becomes active
 * once more (R-4.5). It is sent only then, never when an administrator reactivates an account
 * (R-4.20).
 */
export function reactivatedOwnAccount(
  person: { readonly email: string | null },
  serviceOrigin: string,
): Envelope {
  return {
    to: [person.email],
    message: {
      kind: "reactivated-own-account",
      subject: "Your Digital Marketplace account has been reactivated",
      title: "Your Digital Marketplace account has been reactivated",
      body: [
        {
          kind: "paragraph",
          content: ["You have successfully reactivated your Digital Marketplace account."],
        },
        {
          kind: "paragraph",
          content: ["Welcome back. Your profile and your notification choices are as you left them."],
        },
        { kind: "action", label: "Go to the Digital Marketplace", href: `${serviceOrigin}/dashboard` },
      ],
    },
  };
}
