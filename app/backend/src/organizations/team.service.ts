import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { NamedRefusal } from "../common/refusals";
import { Mailer, MAIL_SETTINGS } from "../mail/mailer";
import { MailSettings } from "../mail/settings";
import {
  invitationAcceptedToMember,
  invitationAcceptedToOwner,
  invitationDeclinedToOwner,
  invitedToRegister,
  invitedToTeam,
} from "../mail/notifications/team";
import { isIdentifier } from "../rules/files";
import {
  ALREADY_ENDED,
  INVALID_MEMBERSHIP_TYPE,
  MembershipStatus,
  MembershipType,
  NOT_PENDING,
  NOT_PERMITTED_TO_ACCEPT,
  NOT_PERMITTED_TO_CHANGE_OWNER,
  NOT_PERMITTED_TO_END_MEMBERSHIP,
  NOT_PERMITTED_TO_MANAGE_TEAM,
  NOT_PERMITTED_TO_READ_ORGANIZATION,
  OrganizationViewer,
  SOLE_OWNER,
  adminRightsRefusal,
  invitationRefusal,
  isInvitableMembershipType,
  isSoleOwner,
  mayAcceptInvitation,
  mayEndMembership,
  mayManageTeam,
  ownershipTransferRefusal,
  teamShown,
} from "../rules/organizations";
import { isEmailAddress } from "../rules/users";
import { Member, ORGANIZATION_STORE, OrganizationStore, StoredOrganization } from "./organization";
import { ARCHIVED_ORGANIZATION, ORGANIZATION_NOT_FOUND, membershipOf, notPermitted, ownerOf } from "./organizations.service";

/** One membership, as the service answers with it. */
export interface MembershipRecord {
  readonly id: string;
  readonly membershipType: MembershipType;
  readonly membershipStatus: MembershipStatus;
  readonly createdAt: string;
  readonly user: { readonly id: string; readonly name: string; readonly capabilities: readonly string[] };
  readonly organization: { readonly id: string; readonly legalName: string };
}

export const MEMBERSHIP_NOT_FOUND = "No membership is held at that address.";
export const INVITEE_EMAIL_INVALID = "Enter an email address in a valid format, like name@example.com";
export const INVITEE_NOT_REGISTERED =
  "This person is not registered with the Digital Marketplace. They have been emailed an invitation to sign up.";
export const ORGANIZATION_REQUIRED = "Name the organization to invite people to.";

/** A refusal filed under the field it is about, as the old service answered validation (R-3.17). */
function invalid(field: string, message: string): NamedRefusal {
  return new NamedRefusal(400, field, [message]);
}

function displayName(member: Pick<Member, "name" | "email">): string {
  return member.name.trim() || member.email || "A vendor";
}

/**
 * An organization's team: inviting by email (R-3.7, R-3.8, R-3.17, R-3.30), reading the team
 * (R-3.14), accepting and declining an invitation (R-3.9, R-3.31, R-3.32), leaving and removal
 * (R-3.10, R-3.11), administrator rights (R-3.12) and transferring ownership (R-3.13), each
 * change of rights or ownership recorded in the changelog (R-3.33).
 *
 * Who may do what is decided by the rules in `rules/organizations.ts`, which the screens call too.
 */
@Injectable()
export class TeamService {
  constructor(
    @Inject(ORGANIZATION_STORE) private readonly organizations: OrganizationStore,
    private readonly mailer: Mailer,
    @Inject(MAIL_SETTINGS) private readonly mail: Pick<MailSettings, "serviceOrigin">,
  ) {}

  /**
   * The team: everyone whose membership stands, active or pending, for a service administrator
   * and the organization's owner and administrators; an ordinary member and anyone else are
   * refused (R-3.14).
   */
  async team(viewer: OrganizationViewer | null, organizationId: string): Promise<MembershipRecord[]> {
    const organization = await this.organization(viewer, organizationId);
    if (!mayManageTeam(viewer, membershipOf(organization, viewer))) {
      throw notPermitted(NOT_PERMITTED_TO_READ_ORGANIZATION);
    }
    return teamShown(organization.members).map((member) => this.membership(organization, member));
  }

  /**
   * Inviting somebody by email address, by a service administrator or the organization's owner or
   * administrators (R-3.7). The invitation names an ordinary member or an owner and nothing else
   * (R-3.17). It is made as a pending membership of an active vendor who has none standing there
   * already (R-3.8), and the person is emailed a way to accept or decline (R-3.35). An address
   * nobody registered uses makes no membership: it is emailed an invitation to sign up, and the
   * inviter is told so (R-3.30).
   */
  async invite(requester: OrganizationViewer | null, value: Readonly<Record<string, unknown>>): Promise<MembershipRecord> {
    if (!requester) throw notPermitted(NOT_PERMITTED_TO_MANAGE_TEAM);
    if (typeof value.organization !== "string") throw invalid("organization", ORGANIZATION_REQUIRED);
    const organization = await this.organization(requester, value.organization);
    if (!mayManageTeam(requester, membershipOf(organization, requester))) {
      throw notPermitted(NOT_PERMITTED_TO_MANAGE_TEAM);
    }
    if (!isInvitableMembershipType(value.membershipType)) throw invalid("membershipType", INVALID_MEMBERSHIP_TYPE);
    if (!organization.active) throw new BadRequestException(ARCHIVED_ORGANIZATION);
    const email = typeof value.userEmail === "string" ? value.userEmail.trim() : "";
    if (!isEmailAddress(email)) throw invalid("userEmail", INVITEE_EMAIL_INVALID);

    const people = await this.organizations.peopleByEmail(email);
    if (people.length === 0) {
      this.mailer.send(invitedToRegister(email, organization, this.mail));
      throw invalid("inviteeNotRegistered", INVITEE_NOT_REGISTERED);
    }
    // An address can be held by a vendor account and by a public sector one; the vendor is the
    // one an organization can invite.
    const invitee = people.find((person) => person.type === "VENDOR") ?? (people[0] as (typeof people)[number]);
    const standing = organization.members.find(
      (member) => member.userId === invitee.id && member.membershipStatus !== "INACTIVE",
    );
    const refusal = invitationRefusal(invitee, standing);
    if (refusal) throw invalid("userEmail", refusal);

    const changed = await this.organizations.invite(organization.id, invitee.id, value.membershipType);
    const member = changed.members.find(
      (candidate) => candidate.userId === invitee.id && candidate.membershipStatus === "PENDING",
    ) as Member;
    this.mailer.send(invitedToTeam(invitee, changed, member.affiliationId, this.mail));
    return this.membership(changed, member);
  }

  /** One change to a membership, named by its tag: `approve`, `updateAdminStatus` or `changeOwner`. */
  async change(requester: OrganizationViewer | null, affiliationId: string, tag: string, value: unknown): Promise<MembershipRecord> {
    switch (tag) {
      case "approve":
        return this.approve(requester, affiliationId);
      case "updateAdminStatus":
        return this.updateAdminStatus(requester, affiliationId, value);
      case "changeOwner":
        return this.changeOwner(requester, affiliationId);
      default:
        throw new BadRequestException("That change cannot be made to a membership.");
    }
  }

  /**
   * Accepting a pending invitation, by the invited person or a service administrator on their
   * behalf; the organization's owner may not (R-3.9). A membership that is not pending cannot be
   * accepted. The owner is told the person joined, and the person that they may now be put
   * forward on the organization's proposals (R-3.31).
   */
  private async approve(requester: OrganizationViewer | null, affiliationId: string): Promise<MembershipRecord> {
    const { organization, member } = await this.membershipAt(requester, affiliationId);
    if (!mayAcceptInvitation(requester, member.userId)) throw notPermitted(NOT_PERMITTED_TO_ACCEPT);
    if (member.membershipStatus !== "PENDING") throw new BadRequestException(NOT_PENDING);
    if (!organization.active) throw new BadRequestException(ARCHIVED_ORGANIZATION);
    const changed = await this.organizations.changeMembership(affiliationId, { membershipStatus: "ACTIVE" });
    const joined = this.memberIn(changed, affiliationId);
    const owner = ownerOf(changed);
    if (owner && owner.userId !== joined.userId) {
      this.mailer.send(invitationAcceptedToOwner(owner, { name: displayName(joined) }, changed, this.mail));
    }
    this.mailer.send(invitationAcceptedToMember(joined, changed, this.mail));
    return this.membership(changed, joined);
  }

  /**
   * Giving or withdrawing administrator rights over the organization, by a service administrator
   * or its owner or administrators, on an active member other than the owner and themselves
   * (R-3.12). Each change is recorded in the changelog (R-3.33).
   */
  private async updateAdminStatus(
    requester: OrganizationViewer | null,
    affiliationId: string,
    value: unknown,
  ): Promise<MembershipRecord> {
    const { organization, member } = await this.membershipAt(requester, affiliationId);
    const refusal = adminRightsRefusal(requester, membershipOf(organization, requester), member);
    if (refusal) {
      if (!requester || !mayManageTeam(requester, membershipOf(organization, requester))) throw notPermitted(refusal);
      throw new BadRequestException(refusal);
    }
    if (typeof value !== "boolean") throw new BadRequestException("Say whether the member is to have administrator rights.");
    const wanted: MembershipType = value ? "ADMIN" : "MEMBER";
    if (member.membershipType === wanted) return this.membership(organization, member);
    const changed = await this.organizations.changeMembership(affiliationId, {
      membershipType: wanted,
      event: { kind: value ? "ADMIN_STATUS_GRANTED" : "ADMIN_STATUS_REVOKED", by: (requester as OrganizationViewer).id },
    });
    return this.membership(changed, this.memberIn(changed, affiliationId));
  }

  /**
   * Transferring ownership, by a service administrator only, to a member whose membership is
   * active; the previous owner becomes an ordinary member (R-3.13), and the transfer is recorded
   * in the changelog (R-3.33).
   */
  private async changeOwner(requester: OrganizationViewer | null, affiliationId: string): Promise<MembershipRecord> {
    if (requester?.type !== "ADMIN") throw notPermitted(NOT_PERMITTED_TO_CHANGE_OWNER);
    const { organization, member } = await this.membershipAt(requester, affiliationId);
    const refusal = ownershipTransferRefusal(requester, member);
    if (refusal) throw new BadRequestException(refusal);
    if (!organization.active) throw new BadRequestException(ARCHIVED_ORGANIZATION);
    const changed = await this.organizations.transferOwnership(organization.id, affiliationId, requester.id);
    return this.membership(changed, this.memberIn(changed, affiliationId));
  }

  /**
   * Ending a membership: by the member themselves (leaving, or declining an invitation), by the
   * organization's owner or administrators, or by a service administrator (R-3.10). It becomes
   * inactive rather than erased. The last remaining owner cannot be removed (R-3.11). When the
   * invited person declines, the owner is told the request was rejected (R-3.32); nobody is told
   * when a member leaves or a pending invitation is withdrawn.
   */
  async end(requester: OrganizationViewer | null, affiliationId: string): Promise<MembershipRecord> {
    const { organization, member } = await this.membershipAt(requester, affiliationId);
    if (!mayEndMembership(requester, member.userId, membershipOf(organization, requester))) {
      throw notPermitted(NOT_PERMITTED_TO_END_MEMBERSHIP);
    }
    if (member.membershipStatus === "INACTIVE") throw new BadRequestException(ALREADY_ENDED);
    if (isSoleOwner(member, organization.members)) throw new BadRequestException(SOLE_OWNER);
    const changed = await this.organizations.changeMembership(affiliationId, { membershipStatus: "INACTIVE" });
    const ended = this.memberIn(changed, affiliationId);
    const declined = member.membershipStatus === "PENDING" && requester?.id === member.userId;
    const owner = ownerOf(changed);
    if (declined && owner) {
      this.mailer.send(invitationDeclinedToOwner(owner, { name: displayName(member) }, changed, this.mail));
    }
    return this.membership(changed, ended);
  }

  /**
   * An organization by its identifier. One that does not exist is not found to an administrator
   * and not permitted to anybody else, as reading one is (decision record 0047).
   */
  private async organization(viewer: OrganizationViewer | null, id: string): Promise<StoredOrganization> {
    const organization = isIdentifier(id) ? await this.organizations.find(id.toLowerCase()) : null;
    if (organization) return organization;
    if (viewer?.type === "ADMIN") throw new NotFoundException(ORGANIZATION_NOT_FOUND);
    throw notPermitted(NOT_PERMITTED_TO_READ_ORGANIZATION);
  }

  /** A membership and its organization; one that does not exist is answered as the organization's would be. */
  private async membershipAt(
    viewer: OrganizationViewer | null,
    affiliationId: string,
  ): Promise<{ organization: StoredOrganization; member: Member }> {
    const id = isIdentifier(affiliationId) ? affiliationId.toLowerCase() : null;
    const organization = id ? await this.organizations.findByMembership(id) : null;
    const member = organization?.members.find((candidate) => candidate.affiliationId === id);
    if (organization && member) return { organization, member };
    if (viewer?.type === "ADMIN") throw new NotFoundException(MEMBERSHIP_NOT_FOUND);
    if (!viewer) throw new UnauthorizedException("Sign in to do that.");
    throw notPermitted(MEMBERSHIP_NOT_FOUND);
  }

  private memberIn(organization: StoredOrganization, affiliationId: string): Member {
    return organization.members.find((candidate) => candidate.affiliationId === affiliationId) as Member;
  }

  private membership(organization: StoredOrganization, member: Member): MembershipRecord {
    return {
      id: member.affiliationId,
      membershipType: member.membershipType,
      membershipStatus: member.membershipStatus,
      createdAt: member.createdAt,
      user: { id: member.userId, name: member.name, capabilities: member.capabilities },
      organization: { id: organization.id, legalName: organization.legalName },
    };
  }
}
