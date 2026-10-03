import { AccountKind } from "../rules/users";
import { MembershipStatus, MembershipType, OrganizationProfile } from "../rules/organizations";

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
}

export const ORGANIZATION_STORE = Symbol("OrganizationStore");

/** Whether a person may read a stored file, for an organization that names one as its logo. */
export interface LogoAccess {
  mayRead(fileId: string, reader: { readonly id: string; readonly type: AccountKind }): Promise<boolean>;
}

export const LOGO_ACCESS = Symbol("LogoAccess");
