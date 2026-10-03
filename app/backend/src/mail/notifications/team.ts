import { Envelope } from "../message";

interface Look {
  readonly serviceOrigin: string;
}

interface Someone {
  readonly name: string;
  readonly email: string | null;
}

interface Organization {
  readonly legalName: string;
}

/**
 * Where an invitation's two choices land: the invited person's own organizations section, with
 * the matching confirmation ready (R-3.35). The address names the membership and the answer and
 * nothing about the reader, who is whoever is signed in when it is opened.
 */
export function invitationAnswerAddress(
  serviceOrigin: string,
  affiliationId: string,
  answer: "accept" | "decline",
): string {
  const search = new URLSearchParams({ tab: "organizations", invitation: affiliationId, answer });
  return `${serviceOrigin}/users/me?${search.toString()}`;
}

/**
 * Sent to a registered vendor an organization has invited to its team, offering to accept and to
 * decline, each opening their own organizations section with that answer ready to confirm
 * (R-3.29, R-3.35). Their notice choice does not govern it, so it does not offer to unsubscribe
 * (R-6.16).
 */
export function invitedToTeam(
  invitee: Someone,
  organization: Organization,
  affiliationId: string,
  look: Look,
): Envelope {
  return {
    to: [invitee.email],
    message: {
      kind: "team-invitation",
      subject: `${organization.legalName} has invited you to join its team`,
      title: `${organization.legalName} has invited you to join its team`,
      body: [
        {
          kind: "paragraph",
          content: [
            `${organization.legalName} has asked you to join its team on the Digital Marketplace. Once you accept, you can be put forward on its proposals.`,
          ],
        },
        {
          kind: "paragraph",
          content: [
            "Accept or decline the invitation from your organizations page: ",
            { text: "Accept the invitation", href: invitationAnswerAddress(look.serviceOrigin, affiliationId, "accept") },
            " or ",
            { text: "Decline the invitation", href: invitationAnswerAddress(look.serviceOrigin, affiliationId, "decline") },
            ".",
          ],
        },
        {
          kind: "action",
          label: "Accept the invitation",
          href: invitationAnswerAddress(look.serviceOrigin, affiliationId, "accept"),
        },
      ],
    },
  };
}

/**
 * Sent to an email address nobody registered with the service uses, when an organization invites
 * it: an invitation to sign up. No membership is made (R-3.30).
 */
export function invitedToRegister(address: string, organization: Organization, look: Look): Envelope {
  return {
    to: [address],
    message: {
      kind: "team-invitation-to-register",
      subject: `${organization.legalName} has invited you to join the Digital Marketplace`,
      title: `${organization.legalName} has invited you to join the Digital Marketplace`,
      body: [
        {
          kind: "paragraph",
          content: [
            `${organization.legalName} would like you to join its team on the Digital Marketplace, but there is no vendor account for this email address yet.`,
          ],
        },
        {
          kind: "paragraph",
          content: [
            `Sign up for a vendor account with this address. ${organization.legalName} can then invite you to its team.`,
          ],
        },
        { kind: "action", label: "Sign up", href: `${look.serviceOrigin}/sign-up` },
      ],
    },
  };
}

/** Sent to the organization's owner when an invited person accepts (R-3.31). */
export function invitationAcceptedToOwner(
  owner: Pick<Someone, "email">,
  member: Pick<Someone, "name">,
  organization: Organization & { readonly id: string },
  look: Look,
): Envelope {
  return {
    to: [owner.email],
    message: {
      kind: "team-invitation-accepted-owner",
      subject: `${member.name} has joined ${organization.legalName}`,
      title: `${member.name} has joined ${organization.legalName}`,
      body: [
        {
          kind: "paragraph",
          content: [`${member.name} has approved your request to join ${organization.legalName}'s team.`],
        },
        {
          kind: "action",
          label: "View your team",
          href: `${look.serviceOrigin}/organizations/${organization.id}/edit?tab=team`,
        },
      ],
    },
  };
}

/** Sent to a person who has accepted an invitation (R-3.31). */
export function invitationAcceptedToMember(member: Pick<Someone, "email">, organization: Organization, look: Look): Envelope {
  return {
    to: [member.email],
    message: {
      kind: "team-invitation-accepted-member",
      subject: `You have joined ${organization.legalName}'s team`,
      title: `You have joined ${organization.legalName}'s team`,
      body: [
        {
          kind: "paragraph",
          content: [
            `You have joined ${organization.legalName}'s team on the Digital Marketplace. You may now be put forward on its proposals.`,
          ],
        },
        { kind: "action", label: "View your organizations", href: `${look.serviceOrigin}/users/me?tab=organizations` },
      ],
    },
  };
}

/** Sent to the organization's owner when an invited person declines (R-3.32). */
export function invitationDeclinedToOwner(
  owner: Pick<Someone, "email">,
  member: Pick<Someone, "name">,
  organization: Organization & { readonly id: string },
  look: Look,
): Envelope {
  return {
    to: [owner.email],
    message: {
      kind: "team-invitation-declined-owner",
      subject: `${member.name} rejected the request to join ${organization.legalName}`,
      title: `${member.name} rejected the request to join ${organization.legalName}`,
      body: [
        {
          kind: "paragraph",
          content: [`${member.name} has rejected your request to join ${organization.legalName}'s team.`],
        },
        {
          kind: "action",
          label: "View your team",
          href: `${look.serviceOrigin}/organizations/${organization.id}/edit?tab=team`,
        },
      ],
    },
  };
}
