import { AccountKind, CAPABILITIES, isEmailAddress } from "./users";

/**
 * Rules about organizations, as plain TypeScript.
 *
 * The registration form, the management page and the service all call these, so the browser and
 * the service never disagree about what a valid profile is or who may do what to one (decision
 * record 0001). Nothing here imports NestJS, Prisma or Node.
 */

// ------------------------------------------------------------------------ memberships

/** The kept schema's `affiliations.membershipType`. */
export type MembershipType = "OWNER" | "ADMIN" | "MEMBER";

/** The kept schema's `affiliations.membershipStatus`. */
export type MembershipStatus = "ACTIVE" | "PENDING" | "INACTIVE";

export interface Membership {
  readonly membershipType: MembershipType;
  readonly membershipStatus: MembershipStatus;
}

/** Somebody using the service, as far as these rules need to know them. */
export interface OrganizationViewer {
  readonly id: string;
  readonly type: AccountKind;
}

/** An active membership that owns or administers the organization. */
export function ownsOrAdministers(membership: Membership | null | undefined): boolean {
  return (
    membership?.membershipStatus === "ACTIVE" &&
    (membership.membershipType === "OWNER" || membership.membershipType === "ADMIN")
  );
}

/** An active membership that owns the organization. */
export function owns(membership: Membership | null | undefined): boolean {
  return membership?.membershipStatus === "ACTIVE" && membership.membershipType === "OWNER";
}

// ------------------------------------------------------------------------ who may do what

/**
 * Only a signed-in vendor who has accepted the service's terms may register an organization
 * (R-3.2).
 */
export function mayRegisterOrganization(
  viewer: { readonly type: AccountKind; readonly acceptedTermsAt: string | null } | null,
): boolean {
  return viewer?.type === "VENDOR" && Boolean(viewer.acceptedTermsAt);
}

export const REGISTRATION_REFUSED =
  "Only a signed-in vendor who has accepted the terms and conditions may register an organization.";

/**
 * An organization's full record is read by a service administrator, and by a member who owns or
 * administers it (R-3.3). The same people see its owner, team size and qualification on the
 * organization list (R-3.21).
 */
export function mayReadOrganization(
  viewer: OrganizationViewer | null,
  membership: Membership | null | undefined,
): boolean {
  if (!viewer) return false;
  return viewer.type === "ADMIN" || ownsOrAdministers(membership);
}

export const NOT_PERMITTED_TO_READ_ORGANIZATION = "You are not permitted to read that organization.";

/**
 * An organization's profile is changed, and the organization archived, only by its owner or a
 * service administrator; an organization administrator who is not the owner may do neither, and
 * is not offered the controls (R-3.6, R-3.18).
 */
export function mayChangeOrganization(
  viewer: OrganizationViewer | null,
  membership: Membership | null | undefined,
): boolean {
  if (!viewer) return false;
  return viewer.type === "ADMIN" || owns(membership);
}

export const NOT_PERMITTED_TO_CHANGE_ORGANIZATION =
  "Only the organization's owner or an administrator may change or archive it.";

/**
 * Only a signed-in vendor may ask which organizations they may act for; anyone else is refused
 * rather than answered with an empty list (R-3.20).
 */
export function mayAskWhomToActFor(viewer: OrganizationViewer | null): boolean {
  return viewer?.type === "VENDOR";
}

export const ACTING_FOR_REFUSED = "Only a signed-in vendor may ask which organizations they can act for.";

/**
 * The organizations a vendor may act for: those they own and those they administer, not those
 * they are an ordinary member of, and never an archived one (R-3.15).
 */
export function mayActFor(organization: { readonly active: boolean }, membership: Membership | null | undefined): boolean {
  return organization.active && ownsOrAdministers(membership);
}

/**
 * Whether the organization list offers the owner, team size and qualification columns at all:
 * to vendors and administrators, never to a visitor or public sector staff (R-3.21).
 */
export function listOffersDetailColumns(viewer: OrganizationViewer | null): boolean {
  return viewer?.type === "VENDOR" || viewer?.type === "ADMIN";
}

/** Whether a vendor may register an organization from the list (design/DESIGN.md, organizations). */
export function listOffersRegistration(viewer: OrganizationViewer | null): boolean {
  return viewer?.type === "VENDOR";
}

// ------------------------------------------------------------------------ qualification

/**
 * Sprint With Us: at least two active team members, who between them hold every capability the
 * service recognises, and the organization's Sprint With Us terms accepted (R-3.25). Only active
 * members count; a pending invitee does not.
 */
export function qualifiesForSprintWithUs(
  activeMemberCapabilities: readonly (readonly string[])[],
  acceptedSWUTerms: string | null,
): boolean {
  if (activeMemberCapabilities.length < 2 || !acceptedSWUTerms) return false;
  const held = new Set(activeMemberCapabilities.flat());
  return CAPABILITIES.every((capability) => held.has(capability.name));
}

/**
 * Team With Us: approved for at least one service area, and the organization's Team With Us terms
 * accepted (R-3.26).
 */
export function qualifiesForTeamWithUs(serviceAreaCount: number, acceptedTWUTerms: string | null): boolean {
  return serviceAreaCount > 0 && Boolean(acceptedTWUTerms);
}

// ------------------------------------------------------------------------ the profile

export interface OrganizationProfile {
  readonly legalName: string;
  readonly websiteUrl: string | null;
  readonly streetAddress1: string;
  readonly streetAddress2: string | null;
  readonly city: string;
  readonly region: string;
  readonly mailCode: string;
  readonly country: string;
  readonly contactName: string;
  readonly contactTitle: string | null;
  readonly contactEmail: string;
  readonly contactPhone: string | null;
}

export type ProfileField = keyof OrganizationProfile;

export type OrganizationProfileErrors = Partial<Record<ProfileField, string>>;

export const PROFILE_TEXT_MAX_LENGTH = 100;

interface FieldRule {
  /** The field's label on the form, without "(optional)". */
  readonly label: string;
  readonly required: boolean;
  readonly maxLength?: number;
  readonly format?: "email" | "url" | "phone";
  /** What to do when the field is required and left empty. */
  readonly missing?: string;
}

/**
 * The profile's fields, in the order the form shows them (R-3.22). Each required one is one to
 * one hundred characters, except the contact email, which is any length in a valid format. The
 * website, second address line, contact title and phone may be left out, but each is checked if
 * given, and the second address line and contact title are held to a hundred characters.
 */
export const PROFILE_FIELDS: Readonly<Record<ProfileField, FieldRule>> = {
  legalName: { label: "Legal name", required: true, maxLength: 100, missing: "Enter the organization’s legal name" },
  websiteUrl: { label: "Website", required: false, format: "url" },
  streetAddress1: { label: "Street address", required: true, maxLength: 100, missing: "Enter the street address" },
  streetAddress2: { label: "Address line 2", required: false, maxLength: 100 },
  city: { label: "City", required: true, maxLength: 100, missing: "Enter the city" },
  region: { label: "Province or state", required: true, maxLength: 100, missing: "Enter the province or state" },
  mailCode: { label: "Postal code or ZIP code", required: true, maxLength: 100, missing: "Enter the postal code or ZIP code" },
  country: { label: "Country", required: true, maxLength: 100, missing: "Enter the country" },
  contactName: { label: "Contact name", required: true, maxLength: 100, missing: "Enter the contact name" },
  contactTitle: { label: "Contact title", required: false, maxLength: 100 },
  contactEmail: { label: "Contact email address", required: true, format: "email" },
  contactPhone: { label: "Contact phone number", required: false, format: "phone" },
};

export const PROFILE_FIELD_ORDER = Object.keys(PROFILE_FIELDS) as ProfileField[];

const FORMAT_MESSAGES = {
  email: "Enter an email address in a valid format, like name@example.com",
  url: "Enter the full website address, like https://example.com, or leave it blank",
  phone: "Enter a phone number in a valid format, like 250-555-0100, or leave it blank",
} as const;

/** A full web address: http or https, and a host with a dot in it. */
export function isWebsiteAddress(text: string): boolean {
  if (/\s/.test(text)) return false;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return false;
  }
  return (url.protocol === "http:" || url.protocol === "https:") && /\.[a-z0-9-]+$/i.test(url.hostname);
}

/**
 * A phone number: digits with the usual separators, an optional leading +, and an optional
 * extension, holding between seven and fifteen digits before any extension.
 */
export function isPhoneNumber(text: string): boolean {
  const match = /^\+?[\d\s().-]+?(?:\s*(?:x|ext\.?)\s*\d{1,6})?$/i.exec(text);
  if (!match) return false;
  const main = text.replace(/(?:x|ext\.?)\s*\d{1,6}$/i, "");
  const digits = main.replace(/\D/g, "").length;
  return digits >= 7 && digits <= 15;
}

/** What is wrong with one field's value, or null when nothing is. */
export function profileFieldError(field: ProfileField, value: string): string | null {
  const rule = PROFILE_FIELDS[field];
  const text = value.trim();
  if (text.length === 0) return rule.required ? (rule.missing ?? FORMAT_MESSAGES.email) : null;
  if (rule.maxLength !== undefined && text.length > rule.maxLength) {
    return `${rule.label} must be ${rule.maxLength} characters or fewer`;
  }
  if (rule.format === "email" && !isEmailAddress(text)) return FORMAT_MESSAGES.email;
  if (rule.format === "url" && !isWebsiteAddress(text)) return FORMAT_MESSAGES.url;
  if (rule.format === "phone" && !isPhoneNumber(text)) return FORMAT_MESSAGES.phone;
  return null;
}

export type ProfileValidation =
  | { readonly ok: true; readonly profile: OrganizationProfile }
  | { readonly ok: false; readonly errors: OrganizationProfileErrors };

/**
 * A profile as it is to be stored: every field trimmed, and an optional field left empty stored
 * as nothing, so clearing the contact phone number removes the number (R-3.19, R-3.22).
 */
export function validateOrganizationProfile(input: Readonly<Record<string, unknown>>): ProfileValidation {
  const errors: OrganizationProfileErrors = {};
  const values: Record<string, string | null> = {};
  for (const field of PROFILE_FIELD_ORDER) {
    const raw = input[field];
    const text = typeof raw === "string" ? raw.trim() : "";
    const error = profileFieldError(field, text);
    if (error) errors[field] = error;
    values[field] = text.length === 0 && !PROFILE_FIELDS[field].required ? null : text;
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, profile: values as unknown as OrganizationProfile };
}

/** A refusal's lines, one per field, each naming the field (R-3.22). */
export function profileErrorLines(errors: OrganizationProfileErrors): string[] {
  return PROFILE_FIELD_ORDER.filter((field) => errors[field]).map(
    (field) => `${PROFILE_FIELDS[field].label}: ${errors[field] as string}`,
  );
}

// ------------------------------------------------------------------------ the list

export const ORGANIZATIONS_PER_PAGE = 50;

/** By legal name, as the list is ordered (R-3.1); ties keep a fixed order by identifier. */
export function compareByLegalName(
  a: { readonly legalName: string; readonly id: string },
  b: { readonly legalName: string; readonly id: string },
): number {
  return a.legalName.localeCompare(b.legalName, "en-CA", { sensitivity: "base" }) || a.id.localeCompare(b.id);
}

export interface ListPage<T> {
  readonly page: number;
  readonly pageCount: number;
  readonly items: readonly T[];
}

/**
 * One page of the list, fifty to a page. A page that is not a whole number, or lies beyond the
 * last, is answered with the first page rather than an empty one (R-3.1).
 */
export function pageOf<T>(items: readonly T[], asked: unknown, perPage: number = ORGANIZATIONS_PER_PAGE): ListPage<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / perPage));
  const number = typeof asked === "number" ? asked : typeof asked === "string" ? Number(asked) : NaN;
  const page = Number.isInteger(number) && number >= 1 && number <= pageCount ? number : 1;
  return { page, pageCount, items: items.slice((page - 1) * perPage, page * perPage) };
}
