import type { Outgoing } from "../mail/mailer";
import type { User } from "./user";

/**
 * The welcome a person is sent when their account is created (R-4.2), offering a way back
 * in. A person with no address is sent nothing: the mailer leaves them out (R-6.28).
 */
export function welcomeMessage(user: User, publicOrigin: string): Outgoing {
  return {
    to: user.email,
    compose: () => ({
      subject: "Welcome to the Digital Marketplace",
      title: "Welcome to the Digital Marketplace",
      paragraphs: [
        `Hello ${user.name}, thank you for creating your Digital Marketplace account.`,
        "You can now sign in to the Digital Marketplace at any time to find opportunities and take part in them.",
      ],
      callToAction: { text: "Sign in", url: `${publicOrigin}/sign-in` },
    }),
  };
}
