import type { Membership, MembershipStatus, MembershipType, OrganizationProfile } from "@rules/organizations";
import { api } from "./client";

/**
 * Organizations, through the contract's listOrganizations, createOrganization, readOrganization,
 * updateOrganization, archiveOrganization and listAffiliations. The contract carries no response
 * shapes, so every answer is read defensively rather than trusted.
 */

/** An organization on the public list; the detail fields are there only for those told them (R-3.21). */
export interface ListedOrganization {
  readonly id: string;
  readonly legalName: string;
  readonly logoImageFile: string | null;
  readonly details: {
    readonly ownerName: string;
    readonly numTeamMembers: number;
    readonly swuQualified: boolean;
    readonly twuQualified: boolean;
  } | null;
}

/** An organization's full record, as its owner, its administrators and an administrator read it (R-3.3). */
export interface Organization extends OrganizationProfile {
  readonly id: string;
  readonly logoImageFile: string | null;
  readonly active: boolean;
  readonly deactivatedOn: string | null;
  readonly ownerName: string | null;
  readonly numTeamMembers: number;
  readonly swuQualified: boolean;
  readonly twuQualified: boolean;
  readonly viewerMembership: Membership | null;
}

/** One of the signed-in person's own memberships. */
export interface OwnMembership {
  readonly id: string;
  readonly membershipType: MembershipType;
  readonly membershipStatus: MembershipStatus;
  readonly organization: {
    readonly id: string;
    readonly legalName: string;
    readonly numTeamMembers: number;
    readonly swuQualified: boolean;
  };
}

type Record_ = Record<string, unknown>;

const isRecord = (value: unknown): value is Record_ => typeof value === "object" && value !== null;
const text = (value: unknown) => (typeof value === "string" ? value : "");
const textOrNull = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : null);
const count = (value: unknown) => (typeof value === "number" ? value : 0);
const MEMBERSHIP_TYPES = new Set(["OWNER", "ADMIN", "MEMBER"]);
const MEMBERSHIP_STATUSES = new Set(["ACTIVE", "PENDING", "INACTIVE"]);

function readMembership(value: unknown): Membership | null {
  if (!isRecord(value)) return null;
  if (!MEMBERSHIP_TYPES.has(value.membershipType as string) || !MEMBERSHIP_STATUSES.has(value.membershipStatus as string)) {
    return null;
  }
  return { membershipType: value.membershipType as MembershipType, membershipStatus: value.membershipStatus as MembershipStatus };
}

const ownerName = (value: unknown) => (isRecord(value) && typeof value.name === "string" ? value.name : null);

export function readListedOrganization(value: unknown): ListedOrganization | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.legalName !== "string") return null;
  return {
    id: value.id,
    legalName: value.legalName,
    logoImageFile: textOrNull(value.logoImageFile),
    details:
      typeof value.numTeamMembers === "number"
        ? {
            ownerName: ownerName(value.owner) ?? "",
            numTeamMembers: value.numTeamMembers,
            swuQualified: value.swuQualified === true,
            twuQualified: value.twuQualified === true,
          }
        : null,
  };
}

export function readOrganization(value: unknown): Organization | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.legalName !== "string") return null;
  return {
    id: value.id,
    legalName: value.legalName,
    logoImageFile: textOrNull(value.logoImageFile),
    websiteUrl: textOrNull(value.websiteUrl),
    streetAddress1: text(value.streetAddress1),
    streetAddress2: textOrNull(value.streetAddress2),
    city: text(value.city),
    region: text(value.region),
    mailCode: text(value.mailCode),
    country: text(value.country),
    contactName: text(value.contactName),
    contactTitle: textOrNull(value.contactTitle),
    contactEmail: text(value.contactEmail),
    contactPhone: textOrNull(value.contactPhone),
    active: value.active !== false,
    deactivatedOn: textOrNull(value.deactivatedOn),
    ownerName: ownerName(value.owner),
    numTeamMembers: count(value.numTeamMembers),
    swuQualified: value.swuQualified === true,
    twuQualified: value.twuQualified === true,
    viewerMembership: readMembership(value.viewerMembership),
  };
}

function readOwnMembership(value: unknown): OwnMembership | null {
  const membership = readMembership(value);
  if (!membership || !isRecord(value) || typeof value.id !== "string" || !isRecord(value.organization)) return null;
  const organization = value.organization;
  if (typeof organization.id !== "string" || typeof organization.legalName !== "string") return null;
  return {
    id: value.id,
    ...membership,
    organization: {
      id: organization.id,
      legalName: organization.legalName,
      numTeamMembers: count(organization.numTeamMembers),
      swuQualified: organization.swuQualified === true,
    },
  };
}

/** The reasons of a refusal: a validation refusal's `errors`, then a permission refusal's `permissions`. */
function reasonsIn(body: unknown): string[] {
  if (!isRecord(body)) return [];
  return [body.errors, body.permissions].flatMap((reasons) =>
    Array.isArray(reasons) ? reasons.filter((reason): reason is string => typeof reason === "string") : [],
  );
}

/** What asking for the list came back with. */
export type OrganizationListAnswer =
  | { readonly kind: "listed"; readonly organizations: readonly ListedOrganization[] }
  | { readonly kind: "refused" }
  | { readonly kind: "failed" };

/** Every organization that is not archived, in the order the service gives (R-3.1). */
export async function fetchOrganizations(): Promise<OrganizationListAnswer> {
  try {
    const { data, response } = await api.GET("/api/organizations");
    if (response.status === 401 || response.status === 403) return { kind: "refused" };
    if (!response.ok || !Array.isArray(data)) return { kind: "failed" };
    const organizations = (data as unknown[]).map(readListedOrganization).filter((entry): entry is ListedOrganization => entry !== null);
    return { kind: "listed", organizations };
  } catch {
    return { kind: "failed" };
  }
}

/** What asking for one organization came back with. */
export type OrganizationAnswer =
  | { readonly kind: "found"; readonly organization: Organization }
  /** Refused, or not there; the screen says neither apart (R-3.3). */
  | { readonly kind: "missing" }
  | { readonly kind: "failed" };

export async function fetchOrganization(id: string): Promise<OrganizationAnswer> {
  try {
    const { data, response } = await api.GET("/api/organizations/{id}", { params: { path: { id } } });
    if (response.ok) {
      const organization = readOrganization(data);
      return organization ? { kind: "found", organization } : { kind: "failed" };
    }
    return response.status >= 500 ? { kind: "failed" } : { kind: "missing" };
  } catch {
    return { kind: "failed" };
  }
}

/** What saving an organization came back with. */
export type SaveAnswer =
  | { readonly kind: "saved"; readonly organization: Organization }
  | { readonly kind: "refused"; readonly reasons: readonly string[] };

async function saved(call: Promise<{ data?: unknown; error?: unknown; response: Response }>): Promise<SaveAnswer> {
  try {
    const { data, error, response } = await call;
    const organization = response.ok ? readOrganization(data) : null;
    return organization ? { kind: "saved", organization } : { kind: "refused", reasons: reasonsIn(error) };
  } catch {
    return { kind: "refused", reasons: [] };
  }
}

/** The profile as the service takes it, with the logo when one is named. */
function body(profile: OrganizationProfile, logoImageFile: string | undefined) {
  const fields: Record<string, string> = {};
  for (const [field, value] of Object.entries(profile)) fields[field] = value ?? "";
  return logoImageFile ? { ...fields, logoImageFile } : fields;
}

/** Registering an organization; the vendor becomes its owner (R-3.2, R-3.23). */
export function createOrganization(profile: OrganizationProfile, logoImageFile?: string): Promise<SaveAnswer> {
  return saved(api.POST("/api/organizations", { body: body(profile, logoImageFile) as never }));
}

/** Changing an organization's profile, the contact phone number included (R-3.18, R-3.19). */
export function updateOrganizationProfile(id: string, profile: OrganizationProfile, logoImageFile?: string): Promise<SaveAnswer> {
  return saved(
    api.PUT("/api/organizations/{id}", {
      params: { path: { id } },
      body: { tag: "updateProfile", value: body(profile, logoImageFile) as never },
    }),
  );
}

/** Archiving an organization (R-3.6). */
export function archiveOrganization(id: string): Promise<SaveAnswer> {
  return saved(api.DELETE("/api/organizations/{id}", { params: { path: { id } } }));
}

/** What asking for one's own memberships came back with. */
export type MembershipsAnswer =
  | { readonly kind: "listed"; readonly memberships: readonly OwnMembership[] }
  | { readonly kind: "failed" };

/** The signed-in person's own memberships, in organizations that are not archived. */
export async function fetchOwnMemberships(): Promise<MembershipsAnswer> {
  try {
    const { data, response } = await api.GET("/api/affiliations");
    if (!response.ok || !Array.isArray(data)) return { kind: "failed" };
    const memberships = (data as unknown[]).map(readOwnMembership).filter((entry): entry is OwnMembership => entry !== null);
    return { kind: "listed", memberships };
  } catch {
    return { kind: "failed" };
  }
}
