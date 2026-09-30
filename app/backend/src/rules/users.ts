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
