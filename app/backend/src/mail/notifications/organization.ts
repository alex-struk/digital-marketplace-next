import { Envelope } from "../message";

interface Look {
  readonly serviceOrigin: string;
  readonly contactEmail: string;
}

/**
 * Sent to an organization's owner when an administrator archives it (R-3.24). Never sent when
 * the owner archives their own organization. An owner with no email address known is sent
 * nothing: the mailer skips a recipient without one (R-6.28).
 */
export function organizationArchivedByAdministrator(
  owner: { readonly email: string | null },
  organization: { readonly legalName: string },
  look: Look,
): Envelope {
  return {
    to: [owner.email],
    message: {
      kind: "organization-archived-by-administrator",
      subject: `${organization.legalName} has been archived`,
      title: `${organization.legalName} has been archived`,
      body: [
        {
          kind: "paragraph",
          content: [
            `An administrator has archived your organization, ${organization.legalName}, on the Digital Marketplace. You can no longer use it, and it can no longer be named on proposals.`,
          ],
        },
        {
          kind: "paragraph",
          content: [
            "If you have any questions, please contact the Digital Marketplace team at ",
            { text: look.contactEmail, href: `mailto:${look.contactEmail}` },
            ".",
          ],
        },
        { kind: "action", label: "View your organizations", href: `${look.serviceOrigin}/users/me?tab=organizations` },
      ],
    },
  };
}
