import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { NamedRefusal } from "../common/refusals";
import { Mailer, MAIL_SETTINGS } from "../mail/mailer";
import { MailSettings } from "../mail/settings";
import { organizationArchivedByAdministrator } from "../mail/notifications/organization";
import { isIdentifier } from "../rules/files";
import {
  ACTING_FOR_REFUSED,
  Membership,
  MembershipStatus,
  MembershipType,
  NOT_PERMITTED_TO_CHANGE_ORGANIZATION,
  NOT_PERMITTED_TO_READ_ORGANIZATION,
  OrganizationProfile,
  OrganizationViewer,
  REGISTRATION_REFUSED,
  compareByLegalName,
  mayActFor,
  mayAskWhomToActFor,
  mayChangeOrganization,
  mayReadOrganization,
  mayRegisterOrganization,
  profileErrorLines,
  qualifiesForSprintWithUs,
  qualifiesForTeamWithUs,
  validateOrganizationProfile,
} from "../rules/organizations";
import {
  LOGO_ACCESS,
  LogoAccess,
  Member,
  ORGANIZATION_STORE,
  OrganizationStore,
  StoredOrganization,
} from "./organization";

/** The person a request comes from, as far as organizations need to know them. */
export interface Requester extends OrganizationViewer {
  readonly acceptedTermsAt: string | null;
}

/** An organization as everybody who may read it in full is answered (R-3.3). */
export interface OrganizationRecord extends OrganizationProfile {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly logoImageFile: string | null;
  readonly active: boolean;
  readonly deactivatedOn: string | null;
  readonly deactivatedBy: string | null;
  readonly acceptedSWUTerms: string | null;
  readonly acceptedTWUTerms: string | null;
  readonly owner: { readonly id: string; readonly name: string } | null;
  /** Active members, the owner included; a pending invitee does not count (R-3.7). */
  readonly numTeamMembers: number;
  readonly swuQualified: boolean;
  readonly twuQualified: boolean;
  readonly serviceAreas: readonly string[];
  /** The requester's own membership, if they have one, so a screen can offer what they may do. */
  readonly viewerMembership: Membership | null;
}

/**
 * An organization on the public list. Its owner, team size and qualification are told only to
 * an administrator and to the vendors who own or administer it (R-3.21).
 */
export interface ListedOrganization {
  readonly id: string;
  readonly legalName: string;
  readonly logoImageFile: string | null;
  readonly active: boolean;
  readonly serviceAreas: readonly string[];
  readonly owner?: { readonly id: string; readonly name: string } | null;
  readonly numTeamMembers?: number;
  readonly swuQualified?: boolean;
  readonly twuQualified?: boolean;
}

/** One of the requester's own memberships, with the organization it is in. */
export interface OwnMembership {
  readonly id: string;
  readonly membershipType: MembershipType;
  readonly membershipStatus: MembershipStatus;
  readonly createdAt: string;
  readonly organization: {
    readonly id: string;
    readonly legalName: string;
    readonly logoImageFile: string | null;
    readonly active: boolean;
    readonly numTeamMembers: number;
    readonly swuQualified: boolean;
    readonly twuQualified: boolean;
  };
}

export const ORGANIZATION_NOT_FOUND = "No organization is held at that address.";
export const ALREADY_ARCHIVED = "This organization has already been archived.";
export const ARCHIVED_ORGANIZATION = "This organization has been archived and can no longer be changed.";
export const LOGO_NOT_USABLE = "Please select a different logo image.";

/**
 * A permission refusal of registering, changing or archiving, filed under `permissions` at 401
 * as the contract names these refusals (decision 0003). Validation refusals stay under `errors`.
 */
function notPermitted(message: string): NamedRefusal {
  return new NamedRefusal(401, "permissions", [message]);
}

function activeMembers(organization: StoredOrganization): Member[] {
  return organization.members.filter((member) => member.membershipStatus === "ACTIVE");
}

function ownerOf(organization: StoredOrganization): Member | null {
  return activeMembers(organization).find((member) => member.membershipType === "OWNER") ?? null;
}

function membershipOf(organization: StoredOrganization, viewer: OrganizationViewer | null): Membership | null {
  if (!viewer) return null;
  // An ended membership is kept on record but counts for nothing.
  const member = organization.members.find(
    (candidate) => candidate.userId === viewer.id && candidate.membershipStatus !== "INACTIVE",
  );
  return member ? { membershipType: member.membershipType, membershipStatus: member.membershipStatus } : null;
}

function standing(organization: StoredOrganization) {
  const active = activeMembers(organization);
  const owner = ownerOf(organization);
  return {
    owner: owner ? { id: owner.userId, name: owner.name } : null,
    numTeamMembers: active.length,
    swuQualified: qualifiesForSprintWithUs(
      active.map((member) => member.capabilities),
      organization.acceptedSWUTerms,
    ),
    twuQualified: qualifiesForTeamWithUs(organization.serviceAreas.length, organization.acceptedTWUTerms),
  };
}

/**
 * Registering organizations, reading them, changing their profiles and archiving them.
 *
 * Who may do what is decided by the rules in `rules/organizations.ts`, which the screens call
 * too, so a control is offered only to someone the service will let use it (R-3.18).
 */
@Injectable()
export class OrganizationsService {
  constructor(
    @Inject(ORGANIZATION_STORE) private readonly organizations: OrganizationStore,
    @Inject(LOGO_ACCESS) private readonly logos: LogoAccess,
    private readonly mailer: Mailer,
    @Inject(MAIL_SETTINGS) private readonly mail: Pick<MailSettings, "serviceOrigin" | "contactEmail">,
  ) {}

  /** Every organization that is not archived, by legal name, to anyone (R-3.1, R-3.21). */
  async list(viewer: OrganizationViewer | null): Promise<ListedOrganization[]> {
    const organizations = (await this.organizations.listActive()).sort(compareByLegalName);
    return organizations.map((organization) => this.listed(organization, viewer));
  }

  /** An organization's full record, for an administrator or its owner or administrators (R-3.3). */
  async read(viewer: OrganizationViewer | null, id: string): Promise<OrganizationRecord> {
    const organization = await this.find(viewer, id);
    if (!mayReadOrganization(viewer, membershipOf(organization, viewer))) {
      throw new UnauthorizedException(NOT_PERMITTED_TO_READ_ORGANIZATION);
    }
    return this.record(organization, viewer);
  }

  /**
   * Registering an organization, by a vendor who has accepted the terms (R-3.2). The profile is
   * checked as the form checks it (R-3.22); the registrant becomes its owner at once and it is
   * active from the start (R-3.23).
   */
  async create(requester: Requester | null, value: Readonly<Record<string, unknown>>): Promise<OrganizationRecord> {
    if (!requester || !mayRegisterOrganization(requester)) throw notPermitted(REGISTRATION_REFUSED);
    const validation = validateOrganizationProfile(value);
    if (!validation.ok) throw new BadRequestException(profileErrorLines(validation.errors));
    const logoImageFile = await this.logo(requester, value.logoImageFile);
    const organization = await this.organizations.create({
      ...validation.profile,
      logoImageFile: logoImageFile ?? null,
      ownerId: requester.id,
    });
    return this.record(organization, requester);
  }

  /**
   * One change to an organization, named by its tag. The profile (`updateProfile`) is changed by
   * its owner or an administrator only (R-3.18), every field together, the contact phone number
   * included, and clearing it removes the stored number (R-3.19). A logo the change does not name
   * is left as it is, and `null` takes it away.
   */
  async change(requester: Requester | null, id: string, tag: string, value: unknown): Promise<OrganizationRecord> {
    if (!requester) throw notPermitted(NOT_PERMITTED_TO_CHANGE_ORGANIZATION);
    if (tag !== "updateProfile") throw new BadRequestException("That change cannot be made here.");
    const organization = await this.find(requester, id);
    if (!mayChangeOrganization(requester, membershipOf(organization, requester))) {
      throw notPermitted(NOT_PERMITTED_TO_CHANGE_ORGANIZATION);
    }
    if (!organization.active) throw new BadRequestException(ARCHIVED_ORGANIZATION);
    const input = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
    const validation = validateOrganizationProfile(input);
    if (!validation.ok) throw new BadRequestException(profileErrorLines(validation.errors));
    const logoImageFile = await this.logo(requester, input.logoImageFile);
    const changed = await this.organizations.update(organization.id, {
      ...validation.profile,
      ...(logoImageFile === undefined ? {} : { logoImageFile }),
    });
    return this.record(changed, requester);
  }

  /**
   * Archiving, by the owner or an administrator (R-3.6, R-3.18). The record and its memberships
   * are kept, marked inactive with the date and who did it. When an administrator archives it,
   * the owner is told by email; an owner archiving their own is not (R-3.24).
   */
  async archive(requester: Requester | null, id: string): Promise<OrganizationRecord> {
    if (!requester) throw notPermitted(NOT_PERMITTED_TO_CHANGE_ORGANIZATION);
    const organization = await this.find(requester, id);
    const membership = membershipOf(organization, requester);
    if (!mayChangeOrganization(requester, membership)) {
      throw notPermitted(NOT_PERMITTED_TO_CHANGE_ORGANIZATION);
    }
    if (!organization.active) throw new BadRequestException(ALREADY_ARCHIVED);
    const archived = await this.organizations.update(organization.id, {
      active: false,
      deactivatedOn: new Date(),
      deactivatedBy: requester.id,
    });
    const owner = ownerOf(archived);
    if (requester.type === "ADMIN" && owner && owner.userId !== requester.id) {
      this.mailer.send(organizationArchivedByAdministrator(owner, archived, this.mail));
    }
    return this.record(archived, requester);
  }

  /**
   * The organizations a signed-in vendor may act for — those they own or administer that are not
   * archived (R-3.15). Anyone else is refused, never answered with an empty list (R-3.20).
   */
  async actingFor(viewer: OrganizationViewer | null): Promise<ListedOrganization[]> {
    if (!viewer || !mayAskWhomToActFor(viewer)) throw new UnauthorizedException(ACTING_FOR_REFUSED);
    const organizations = (await this.organizations.affiliatedWith(viewer.id))
      .filter((organization) => mayActFor(organization, membershipOf(organization, viewer)))
      .sort(compareByLegalName);
    return organizations.map((organization) => this.listed(organization, viewer));
  }

  /**
   * The requester's own memberships that stand — active or awaiting their answer — in
   * organizations that are not archived (R-3.6), by legal name.
   */
  async ownMemberships(viewer: OrganizationViewer): Promise<OwnMembership[]> {
    const memberships: OwnMembership[] = [];
    const organizations = (await this.organizations.affiliatedWith(viewer.id))
      .filter((organization) => organization.active)
      .sort(compareByLegalName);
    for (const organization of organizations) {
      const member = organization.members.find(
        (candidate) => candidate.userId === viewer.id && candidate.membershipStatus !== "INACTIVE",
      );
      if (!member) continue;
      const { numTeamMembers, swuQualified, twuQualified } = standing(organization);
      memberships.push({
        id: member.affiliationId,
        membershipType: member.membershipType,
        membershipStatus: member.membershipStatus,
        createdAt: member.createdAt,
        organization: {
          id: organization.id,
          legalName: organization.legalName,
          logoImageFile: organization.logoImageFile,
          active: organization.active,
          numTeamMembers,
          swuQualified,
          twuQualified,
        },
      });
    }
    return memberships;
  }

  /**
   * An organization by its identifier. One that does not exist is not found to an administrator
   * and not permitted to anybody else, so nobody else learns which identifiers are held.
   */
  private async find(viewer: OrganizationViewer | null, id: string): Promise<StoredOrganization> {
    const organization = isIdentifier(id) ? await this.organizations.find(id.toLowerCase()) : null;
    if (organization) return organization;
    if (viewer?.type === "ADMIN") throw new NotFoundException(ORGANIZATION_NOT_FOUND);
    throw new UnauthorizedException(NOT_PERMITTED_TO_READ_ORGANIZATION);
  }

  /**
   * The logo a request names: undefined when it names none, null to take it away, or a stored
   * picture the requester may read (R-8.28). Anything else is refused.
   */
  private async logo(requester: Requester, named: unknown): Promise<string | null | undefined> {
    if (named === undefined) return undefined;
    if (named === null) return null;
    if (!isIdentifier(named) || !(await this.logos.mayRead(named.toLowerCase(), requester))) {
      throw new BadRequestException(LOGO_NOT_USABLE);
    }
    return named.toLowerCase();
  }

  private listed(organization: StoredOrganization, viewer: OrganizationViewer | null): ListedOrganization {
    const base: ListedOrganization = {
      id: organization.id,
      legalName: organization.legalName,
      logoImageFile: organization.logoImageFile,
      active: organization.active,
      serviceAreas: organization.serviceAreas,
    };
    if (!mayReadOrganization(viewer, membershipOf(organization, viewer))) return base;
    return { ...base, ...standing(organization) };
  }

  private record(organization: StoredOrganization, viewer: OrganizationViewer | null): OrganizationRecord {
    return {
      id: organization.id,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      legalName: organization.legalName,
      logoImageFile: organization.logoImageFile,
      websiteUrl: organization.websiteUrl,
      streetAddress1: organization.streetAddress1,
      streetAddress2: organization.streetAddress2,
      city: organization.city,
      region: organization.region,
      mailCode: organization.mailCode,
      country: organization.country,
      contactName: organization.contactName,
      contactTitle: organization.contactTitle,
      contactEmail: organization.contactEmail,
      contactPhone: organization.contactPhone,
      active: organization.active,
      deactivatedOn: organization.deactivatedOn,
      deactivatedBy: organization.deactivatedBy,
      acceptedSWUTerms: organization.acceptedSWUTerms,
      acceptedTWUTerms: organization.acceptedTWUTerms,
      serviceAreas: organization.serviceAreas,
      ...standing(organization),
      viewerMembership: membershipOf(organization, viewer),
    };
  }
}
