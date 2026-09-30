import { Envelope } from "../message";

/**
 * The welcome message, sent when a person's account has just been made, offering a way back
 * to sign in (R-4.2). A person with no email address known is sent nothing: the mailer skips
 * a recipient without one (R-6.28).
 */
export function welcome(
  person: { readonly email: string | null },
  serviceOrigin: string,
): Envelope {
  return {
    to: [person.email],
    message: {
      kind: "welcome",
      subject: "Welcome to the Digital Marketplace",
      title: "Welcome to the Digital Marketplace",
      body: [
        {
          kind: "paragraph",
          content: [
            "Thank you for signing up for the Digital Marketplace. Your account has been created.",
          ],
        },
        {
          kind: "paragraph",
          content: [
            "Sign in to find opportunities, and to keep your profile and your notification choices up to date.",
          ],
        },
        { kind: "action", label: "Sign in", href: `${serviceOrigin}/sign-in` },
      ],
    },
  };
}
