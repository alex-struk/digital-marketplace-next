import { AccountKind, AccountStatus } from "../rules/users";
import {
  AffiliationEventKind,
  MembershipStatus,
  MembershipType,
  OrganizationProfile,
} from "../rules/organizations";

/**
 * An organization as the kept `organizations` table holds it, with the people affiliated to it
 * and the service areas it is approved for. Dates are ISO 8601 instants, or null when never set.
 */
export interface StoredOrganization extends OrganizationProfile {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly logoImageFile: string | null;
  readonly active: boolean;
  readonly deactivatedOn: string | null;
  readonly deactivatedBy: string | null;
  readonly acceptedSWUTerms: string | null;
  readonly acceptedTWUTerms: string | null;
  /** Every affiliation, whatever its status. */
  readonly members: readonly Member[];
  /** The service areas it is approved for, by their kept code (`serviceAreas.serviceArea`). */
  readonly serviceAreas: readonly string[];
  /** Every grant and withdrawal of administrator rights and transfer of ownership (R-3.33). */
  readonly events: readonly MembershipEvent[];
}

/** One entry in an organization's changelog, as `affiliationEvents` holds it. */
export interface MembershipEvent {
  readonly id: string;
  readonly affiliationId: string;
  readonly event: AffiliationEventKind;
  readonly createdAt: string;
  /** Who made the change, or null where the account is no longer known. */
  readonly createdBy: { readonly id: string; readonly name: string } | null;
}

/** An account found by the email address an invitation names (R-3.8, R-3.30). */
export interface Person {
  readonly id: string;
  readonly name: string;
  readonly email: string | null;
  readonly type: AccountKind;
  readonly status: AccountStatus;
}

/** A change to one membership, and the changelog entry it makes, if any. */
export interface MembershipChange {
  readonly membershipType?: MembershipType;
  readonly membershipStatus?: MembershipStatus;
  readonly event?: { readonly kind: AffiliationEventKind; readonly by: string };
}

/** One person's affiliation with an organization. */
export interface Member {
  readonly affiliationId: string;
  readonly userId: string;
  readonly name: string;
  readonly email: string | null;
  readonly type: AccountKind;
  readonly capabilities: readonly string[];
  readonly membershipType: MembershipType;
  readonly membershipStatus: MembershipStatus;
  readonly createdAt: string;
}

/** A new organization and the vendor who registers it, who becomes its owner (R-3.23). */
export interface NewOrganization extends OrganizationProfile {
  readonly logoImageFile: string | null;
  readonly ownerId: string;
}

/** A change to an organization. Only the fields named are changed. */
export interface OrganizationChange extends Partial<OrganizationProfile> {
  readonly logoImageFile?: string | null;
  readonly active?: boolean;
  readonly deactivatedOn?: Date;
  readonly deactivatedBy?: string;
  readonly acceptedSWUTerms?: Date;
  readonly acceptedTWUTerms?: Date;
}

/**
 * Where organizations are kept. The service is written against this rather than against Prisma,
 * so its rules can be tested without a database.
 */
export interface OrganizationStore {
  /** Every organization that has not been archived (R-3.1). */
  listActive(): Promise<StoredOrganization[]>;
  find(id: string): Promise<StoredOrganization | null>;
  /** Every organization a person is affiliated with, archived or not, whatever the status. */
  affiliatedWith(userId: string): Promise<StoredOrganization[]>;
  /** Makes the organization, active, with its registrant as its active owner (R-3.23). */
  create(organization: NewOrganization): Promise<StoredOrganization>;
  update(id: string, change: OrganizationChange): Promise<StoredOrganization>;
  /** The organization a membership is in, whatever the membership's status. */
  findByMembership(affiliationId: string): Promise<StoredOrganization | null>;
  /** Every account holding this email address, compared without regard to case. */
  peopleByEmail(email: string): Promise<Person[]>;
  /** A new pending membership of this person in this organization (R-3.7). */
  invite(organizationId: string, userId: string, membershipType: MembershipType): Promise<StoredOrganization>;
  /** Changes one membership, recording its changelog entry with it when one is named. */
  changeMembership(affiliationId: string, change: MembershipChange): Promise<StoredOrganization>;
  /**
   * Makes one active member the owner and every other owner an ordinary member, recording the
   * transfer in the changelog, all at once (R-3.13, R-3.33).
   */
  transferOwnership(organizationId: string, toAffiliationId: string, by: string): Promise<StoredOrganization>;
  /**
   * Makes these, by their kept code, the only service areas the organization is approved for,
   * every earlier approval removed, all at once (R-3.28).
   */
  approveServiceAreas(organizationId: string, serviceAreas: readonly string[]): Promise<StoredOrganization>;
}

export const ORGANIZATION_STORE = Symbol("OrganizationStore");

/** Whether a person may read a stored file, for an organization that names one as its logo. */
export interface LogoAccess {
  mayRead(fileId: string, reader: { readonly id: string; readonly type: AccountKind }): Promise<boolean>;
}

export const LOGO_ACCESS = Symbol("LogoAccess");
