/**
 * Rules about accounts, as plain TypeScript.
 *
 * Nothing in this directory imports NestJS, Prisma or Node. The service and the single-page
 * app both call these functions, so the browser and the service can never disagree about a
 * rule (decision record 0001).
 */

/** The three kinds of account the kept schema records (`users.type`). */
export type AccountKind = "VENDOR" | "GOV" | "ADMIN";

/** Whether an account may be used (`users.status`). */
export type AccountStatus = "ACTIVE" | "INACTIVE_USER" | "INACTIVE_ADMIN";

/**
 * The kind of account a first sign-in makes, decided by the identity the person signed in
 * with (R-4.1): a government identity makes a public sector employee, and a code-hosting or
 * business identity makes a vendor. An administrator is never made this way; only another
 * administrator makes one (R-4.13).
 *
 * The identity provider names itself in the token's `identity_provider` claim. An identity
 * the service does not recognise as either kind makes no account at all, and the person is
 * shown the sign-in failure notice (R-4.1).
 */
const GOVERNMENT_IDENTITIES = new Set(["idir", "azureidir"]);
const VENDOR_IDENTITIES = new Set([
  "github",
  "bceid",
  "bceidbasic",
  "bceidbusiness",
  "bceidboth",
]);

export function accountKindForIdentity(
  identityProvider: string | null | undefined,
): "GOV" | "VENDOR" | null {
  const name = (identityProvider ?? "").trim().toLowerCase();
  if (GOVERNMENT_IDENTITIES.has(name)) return "GOV";
  if (VENDOR_IDENTITIES.has(name)) return "VENDOR";
  return null;
}

/**
 * The account kinds a person signing in with an identity of the given kind may hold. A
 * public sector employee an administrator has promoted is still the same person signing in
 * with the same government identity.
 */
export function accountKindsFor(kind: "GOV" | "VENDOR"): readonly AccountKind[] {
  return kind === "GOV" ? ["GOV", "ADMIN"] : ["VENDOR"];
}

/** Whether an account is a public sector employee, administrators included. */
export function isPublicSector(kind: AccountKind): boolean {
  return kind === "GOV" || kind === "ADMIN";
}

// ------------------------------------------------------------------------ the profile

export const NAME_MAX_LENGTH = 100;
export const JOB_TITLE_MAX_LENGTH = 100;

/**
 * An email address in a valid format: something, an at sign, a domain with at least one dot,
 * and no spaces anywhere. Deliberately no stricter than that; the service cannot know
 * whether an address is deliverable, only whether it is shaped like one.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Whether text is shaped like an email address, by the one rule every form uses. */
export function isEmailAddress(text: string): boolean {
  return EMAIL_PATTERN.test(text);
}

export interface ProfileInput {
  readonly name: string;
  readonly email: string;
  readonly jobTitle?: string | null;
}

export interface ProfileErrors {
  name?: string;
  email?: string;
  jobTitle?: string;
}

export interface ValidProfile {
  readonly name: string;
  /** Stored in lower case (R-4.27). */
  readonly email: string;
  /** Absent when the request did not carry one; empty when it was left blank. */
  readonly jobTitle?: string;
}

export type ProfileValidation =
  | { readonly ok: true; readonly profile: ValidProfile }
  | { readonly ok: false; readonly errors: ProfileErrors };

/**
 * A profile requires a name of one to one hundred characters and an email address in a valid
 * format, which is stored in lower case; the job title may be left blank and is limited to
 * one hundred characters (R-4.27). The profile picture is optional and is not checked here.
 */
export function validateProfile(input: ProfileInput): ProfileValidation {
  const errors: ProfileErrors = {};
  const name = (input.name ?? "").trim();
  const email = (input.email ?? "").trim().toLowerCase();

  if (name.length === 0) {
    errors.name = "Enter your name";
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = `Enter a name of ${NAME_MAX_LENGTH} characters or fewer`;
  }

  if (email.length === 0 || !EMAIL_PATTERN.test(email)) {
    errors.email =
      "Enter an email address in a valid format, like name@example.com";
  }

  let jobTitle: string | undefined;
  if (input.jobTitle !== undefined && input.jobTitle !== null) {
    jobTitle = input.jobTitle.trim();
    if (jobTitle.length > JOB_TITLE_MAX_LENGTH) {
      errors.jobTitle = `Enter a job title of ${JOB_TITLE_MAX_LENGTH} characters or fewer`;
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    profile: jobTitle === undefined ? { name, email } : { name, email, jobTitle },
  };
}

/**
 * The job title is asked for and shown only on a public sector employee's profile; a vendor
 * is never asked for one (R-4.28).
 */
export function asksForJobTitle(kind: AccountKind): boolean {
  return isPublicSector(kind);
}

// ------------------------------------------------------------------------ capabilities

/**
 * The service's own list of capabilities a vendor may hold (R-4.8). These are the names the
 * kept data stores and the ones a Sprint With Us qualification counts across a team. The
 * descriptions are the rebuild's own: the specification does not carry the old wording
 * (design/DESIGN.md, users gap 7).
 */
export const CAPABILITIES: readonly { readonly name: string; readonly description: string }[] = [
  {
    name: "Agile Coaching",
    description: "Helping teams adopt agile ways of working, and coaching them as they improve how they deliver.",
  },
  {
    name: "Backend Development",
    description: "Building and maintaining server-side services, application programming interfaces and data stores.",
  },
  {
    name: "Delivery Management",
    description: "Planning and guiding the delivery of a digital service, and removing what blocks the team.",
  },
  {
    name: "DevOps Engineering",
    description: "Automating how software is built, tested, deployed and run, and keeping it running well.",
  },
  {
    name: "Frontend Development",
    description: "Building accessible user interfaces for the web that work on any device.",
  },
  {
    name: "Security Engineering",
    description: "Designing and checking systems so that they protect people's information and resist attack.",
  },
  {
    name: "Technical Architecture",
    description: "Shaping how the parts of a system fit together so that it can grow and change safely.",
  },
  {
    name: "User Experience Design",
    description: "Designing services that are simple and clear to use, based on what people need.",
  },
  {
    name: "User Research",
    description: "Planning and running research with the people who use a service, and sharing what is learned.",
  },
];

const CAPABILITY_NAMES = new Set(CAPABILITIES.map((capability) => capability.name));

/**
 * A set of capabilities to record: only names from the service's own list, each once. An empty
 * set is valid (R-4.8). Returns null when anything else is offered.
 */
export function validCapabilities(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const chosen: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string" || !CAPABILITY_NAMES.has(entry)) return null;
    if (!chosen.includes(entry)) chosen.push(entry);
  }
  // Kept in the list's own order, so the same choice is always stored the same way.
  return CAPABILITIES.map((capability) => capability.name).filter((name) => chosen.includes(name));
}

/** Only a vendor records capabilities, and only on their own account (R-4.8). */
export function mayRecordCapabilities(kind: AccountKind): boolean {
  return kind === "VENDOR";
}

// ------------------------------------------------------------------------ reading a profile

export interface Viewer {
  readonly id: string;
  readonly type: AccountKind;
}

/**
 * A person's account may be read only by that person or by an administrator (R-4.25).
 */
export function mayReadAccount(viewer: Viewer | null, accountId: string): boolean {
  if (!viewer) return false;
  return viewer.id === accountId || viewer.type === "ADMIN";
}

/** A profile's sections, in the order its navigation lists them. */
export type ProfileSection = "profile" | "capabilities" | "organizations" | "notifications" | "legal";

/**
 * The sections a profile offers, by whose it is and who is looking (R-4.34, R-4.33): a vendor's
 * own offers all five, a public sector employee's or an administrator's own offers the profile
 * and notifications, and an administrator looking at somebody else's sees the profile alone.
 */
export function profileSections(
  viewer: Viewer,
  owner: { readonly id: string; readonly type: AccountKind },
): readonly ProfileSection[] {
  if (viewer.id !== owner.id) return ["profile"];
  return isPublicSector(owner.type)
    ? ["profile", "notifications"]
    : ["profile", "capabilities", "organizations", "notifications", "legal"];
}

/**
 * The section shown for the one asked for. A section the profile does not offer shows the
 * profile section instead, with no error (R-4.34).
 */
export function profileSectionShown(
  offered: readonly ProfileSection[],
  asked: unknown,
): ProfileSection {
  return typeof asked === "string" && offered.includes(asked as ProfileSection)
    ? (asked as ProfileSection)
    : "profile";
}

/**
 * A person may deactivate their own account (R-4.9). An administrator is offered no control to
 * deactivate their own, though the service accepts the request (R-4.31).
 */
export function offersOwnDeactivation(kind: AccountKind): boolean {
  return kind !== "ADMIN";
}

// ------------------------------------------------------------------------ finishing sign-up

export interface TermsRecord {
  readonly type: AccountKind;
  readonly acceptedTermsAt: string | null;
  readonly lastAcceptedTermsAt: string | null;
}

/** Whether a person has agreed to the service's terms at any time (R-4.3). */
export function hasEverAgreedToTerms(account: TermsRecord): boolean {
  return account.acceptedTermsAt !== null || account.lastAcceptedTermsAt !== null;
}

/**
 * The profile-completion page is offered only to a vendor who has not yet agreed to the
 * terms (R-4.23). A vendor who agreed before — including one whose acceptance was later
 * withdrawn by an announcement of changed terms — and every public sector employee go to
 * their dashboard instead.
 */
export function needsProfileCompletion(account: TermsRecord): boolean {
  return account.type === "VENDOR" && !hasEverAgreedToTerms(account);
}

/**
 * Only a vendor agrees to the service's terms; a public sector employee is never asked to
 * (R-4.3).
 */
export function mayAgreeToTerms(kind: AccountKind): boolean {
  return kind === "VENDOR";
}

// ------------------------------------------------------------------------ an administrator's powers

/**
 * Only an administrator may read the list of everyone registered; a public sector employee who
 * is not one, a vendor and a visitor are all refused, so nobody else learns every person's email
 * address and status (R-4.21).
 */
export function mayListAccounts(viewer: Viewer | null): boolean {
  return viewer?.type === "ADMIN";
}

/**
 * Only an administrator may deactivate or reactivate somebody else's account, or grant or
 * withdraw administrator rights (R-4.12, R-4.18, R-4.19, R-4.30).
 */
export function administers(viewer: Viewer | null): boolean {
  return viewer?.type === "ADMIN";
}

/** The refusal of administrator rights to a vendor, in the words the profile shows (R-4.12). */
export const VENDORS_CANNOT_BE_ADMINISTRATORS = "Vendors cannot be granted administrator permissions.";

/** The refusal of a deactivation of an account that is already inactive (R-4.31). */
export const ALREADY_INACTIVE = "This account is already inactive.";

/** The refusal of a reactivation of an account its owner deactivated (R-4.19). */
export const REACTIVATED_BY_SIGNING_IN =
  "This account was deactivated by its owner, who reactivates it by signing in again.";

/** The refusal of a reactivation of an account that is in use. */
export const ALREADY_ACTIVE = "This account is already active.";

/**
 * The account kind granting or withdrawing administrator rights leaves a person with, or the
 * reason it is refused. Only a public sector employee's account may hold them; a vendor never
 * may, and withdrawing them returns the person to an ordinary public sector employee (R-4.12).
 */
export function kindWithAdministratorRights(
  current: AccountKind,
  granted: boolean,
): { readonly ok: true; readonly kind: AccountKind } | { readonly ok: false; readonly reason: string } {
  if (current === "VENDOR") return { ok: false, reason: VENDORS_CANNOT_BE_ADMINISTRATORS };
  return { ok: true, kind: granted ? "ADMIN" : "GOV" };
}

/**
 * Why an administrator may not reactivate this account, or null when they may: only an account
 * an administrator deactivated is reactivated by one; its owner's own deactivation is undone by
 * their signing in again (R-4.19).
 */
export function reactivationRefusal(status: AccountStatus): string | null {
  if (status === "INACTIVE_ADMIN") return null;
  return status === "INACTIVE_USER" ? REACTIVATED_BY_SIGNING_IN : ALREADY_ACTIVE;
}

/** Whether the profile offers an administrator the reactivation control (R-4.19). */
export function offersReactivation(status: AccountStatus): boolean {
  return reactivationRefusal(status) === null;
}

// ------------------------------------------------------------------------ the list of users

export interface ListedAccount {
  readonly type: AccountKind;
  readonly status: AccountStatus;
  readonly name: string;
}

/** An account's kind as a person reads it; an administrator is a public sector employee. */
export function accountKindLabel(kind: AccountKind): string {
  return kind === "VENDOR" ? "Vendor" : "Public sector employee";
}

/** An account's status as a person reads it: both kinds of deactivation read as inactive. */
export function accountStatusLabel(status: AccountStatus): string {
  return status === "ACTIVE" ? "Active" : "Inactive";
}

/**
 * The order the list of users is read in: by status, active accounts first, then by account
 * kind, then by name (R-4.14).
 */
export function compareListedAccounts(a: ListedAccount, b: ListedAccount): number {
  return (
    accountStatusLabel(a.status).localeCompare(accountStatusLabel(b.status)) ||
    accountKindLabel(a.type).localeCompare(accountKindLabel(b.type)) ||
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}

/**
 * Whether a name matches what was typed into the search: every word typed appears somewhere in
 * the name, in any order, whatever the case. Nothing but the name is searched, and an empty
 * search matches everyone (R-4.14).
 */
export function nameMatchesSearch(name: string, search: string): boolean {
  const words = search.toLowerCase().split(/\s+/).filter((word) => word.length > 0);
  const haystack = name.toLowerCase();
  return words.every((word) => haystack.includes(word));
}

// ------------------------------------------------------------------------ the contact list

/** The account kinds an export may be asked for; administrators come with public sector employees. */
export type ContactKind = "GOV" | "VENDOR";

/** The fields an export may carry, in the order its columns follow (R-4.32). */
export const CONTACT_FIELDS = ["firstName", "lastName", "email", "organizationName"] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];

const CONTACT_FIELD_HEADINGS: Record<ContactField, string> = {
  firstName: "First Name",
  lastName: "Last Name",
  email: "Email",
  organizationName: "Organization Name",
};

export interface ContactListRequest {
  readonly kinds: readonly ContactKind[];
  readonly fields: readonly ContactField[];
}

const commaList = (value: unknown): string[] =>
  typeof value === "string"
    ? value.split(",").map((entry) => entry.trim()).filter((entry) => entry.length > 0)
    : [];

/**
 * What an export asks for, from the two comma-separated lists the address carries. At least one
 * account kind and one field must be chosen, and nothing outside the lists may be (R-4.32).
 */
export function readContactListRequest(
  userTypes: unknown,
  fields: unknown,
): { readonly ok: true; readonly request: ContactListRequest } | { readonly ok: false; readonly errors: string[] } {
  const errors: string[] = [];

  const kinds: ContactKind[] = [];
  for (const entry of commaList(userTypes)) {
    const kind = entry.toUpperCase();
    if (kind !== "GOV" && kind !== "VENDOR") {
      errors.push(`"${entry}" is not an account type that can be exported.`);
    } else if (!kinds.includes(kind)) kinds.push(kind);
  }
  if (kinds.length === 0 && errors.length === 0) errors.push("Choose at least one account type to export.");

  const chosen: ContactField[] = [];
  const fieldErrors: string[] = [];
  for (const entry of commaList(fields)) {
    const field = CONTACT_FIELDS.find((name) => name.toLowerCase() === entry.toLowerCase());
    if (!field) fieldErrors.push(`"${entry}" is not a field that can be exported.`);
    else if (!chosen.includes(field)) chosen.push(field);
  }
  if (chosen.length === 0 && fieldErrors.length === 0) fieldErrors.push("Choose at least one field to export.");
  errors.push(...fieldErrors);

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    request: {
      kinds: (["GOV", "VENDOR"] as const).filter((kind) => kinds.includes(kind)),
      fields: CONTACT_FIELDS.filter((field) => chosen.includes(field)),
    },
  };
}

/** The account kinds an export of these kinds lists: administrators come with public sector employees. */
export function accountKindsExported(kinds: readonly ContactKind[]): AccountKind[] {
  return kinds.flatMap((kind): AccountKind[] => (kind === "GOV" ? ["GOV", "ADMIN"] : ["VENDOR"]));
}

/**
 * A name split for the export at its first space: one word leaves the last name empty, and
 * everything after the first word is the last name (R-4.32).
 */
export function splitName(name: string): { readonly firstName: string; readonly lastName: string } {
  const trimmed = name.trim();
  const space = trimmed.indexOf(" ");
  return space < 0
    ? { firstName: trimmed, lastName: "" }
    : { firstName: trimmed.slice(0, space), lastName: trimmed.slice(space + 1).trim() };
}

export interface Contact {
  readonly type: AccountKind;
  readonly name: string;
  readonly email: string | null;
  /** The legal names of the active organizations the person currently belongs to. */
  readonly organizationNames: readonly string[];
}

const CONTACT_KIND_LABELS: Record<AccountKind, string> = {
  GOV: "Public Sector Employee",
  ADMIN: "Administrator",
  VENDOR: "Vendor",
};

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * The exported file, as comma-separated values with a heading row. The account-kind column
 * appears only when both kinds were chosen, and an administrator is labelled as one; a person's
 * organizations are joined into one field (R-4.32).
 */
export function contactListCsv(request: ContactListRequest, contacts: readonly Contact[]): string {
  const withKind = request.kinds.length > 1;
  const headings = [
    ...(withKind ? ["Account Type"] : []),
    ...request.fields.map((field) => CONTACT_FIELD_HEADINGS[field]),
  ];
  const rows = contacts.map((contact) => {
    const { firstName, lastName } = splitName(contact.name);
    const values: Record<ContactField, string> = {
      firstName,
      lastName,
      email: contact.email ?? "",
      organizationName: contact.organizationNames.join("; "),
    };
    return [
      ...(withKind ? [CONTACT_KIND_LABELS[contact.type]] : []),
      ...request.fields.map((field) => values[field]),
    ];
  });
  return [headings, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

/** The name the exported file is offered under, dated the day it was made. */
export function contactListFileName(on: Date): string {
  return `dm-contacts-${on.toISOString().slice(0, 10)}.csv`;
}
