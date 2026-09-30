/**
 * Rules about accounts, as plain TypeScript.
 *
 * Nothing in this directory imports NestJS, Prisma or Node. The service and the single-page
 * app both call these functions, so the browser and the service can never disagree about a
 * rule (decision record 0001).
 */

/** The three kinds of account the kept schema records (`users.type`). */
export type AccountKind = "VENDOR" | "GOV" | "ADMIN";

/** Active, deactivated by its owner, or deactivated by an administrator (`users.status`). */
export type AccountStatus = "ACTIVE" | "INACTIVE_USER" | "INACTIVE_ADMIN";

/**
 * The kind of account an identity makes the first time it signs in (R-4.1): a government
 * identity makes a public sector employee and a code-hosting identity makes a vendor. An
 * identity the service does not recognise as either makes nothing, and the sign-in fails.
 *
 * The identity provider names the identity by the suffix the old service used for it.
 */
export function accountKindForIdentity(
  identityProvider: string | null | undefined,
): "VENDOR" | "GOV" | null {
  switch ((identityProvider ?? "").trim().toLowerCase()) {
    case "idir":
      return "GOV";
    case "github":
      return "VENDOR";
    default:
      return null;
  }
}

/**
 * The kinds of stored account one kind of identity can be. An administrator is a public
 * sector employee promoted inside the service, so a government identity finds either.
 */
export function accountKindsForIdentity(kind: "VENDOR" | "GOV"): AccountKind[] {
  return kind === "GOV" ? ["GOV", "ADMIN"] : ["VENDOR"];
}

/** Whether an account is a public sector employee, administrators included. */
export function isPublicSector(kind: AccountKind): boolean {
  return kind === "GOV" || kind === "ADMIN";
}

/**
 * Whether a person still has to finish signing up: a vendor who has never agreed to the
 * terms (R-4.3, R-4.23). A vendor whose standing agreement was withdrawn by a later change of
 * terms has agreed before, and is not sent back here; nobody but a vendor ever is.
 */
export function needsProfileCompletion(account: {
  readonly type: AccountKind;
  readonly lastAcceptedTermsAt: string | null;
}): boolean {
  return account.type === "VENDOR" && !account.lastAcceptedTermsAt;
}

/** The longest a name or a job title may be (R-4.27). */
export const PROFILE_TEXT_MAX_LENGTH = 100;

/**
 * An email address in a valid format: something, one `@`, and a domain with a dot in it,
 * with no spaces anywhere.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ProfileInput {
  readonly name: string;
  readonly email: string;
  readonly jobTitle?: string;
}

export interface ProfileProblems {
  readonly name?: string;
  readonly email?: string;
  readonly jobTitle?: string;
}

export interface ValidProfile {
  readonly name: string;
  /** Stored in lower case (R-4.27). */
  readonly email: string;
  readonly jobTitle: string;
}

export type ProfileValidation =
  | { readonly valid: true; readonly profile: ValidProfile }
  | { readonly valid: false; readonly problems: ProfileProblems };

/**
 * A profile's details (R-4.27): a name of one to one hundred characters, an email address in
 * a valid format, stored in lower case, and a job title that may be blank and is at most one
 * hundred characters. Leading and trailing spaces are not part of any of them.
 *
 * The wording of each problem is the sentence a person reads under the field.
 */
export function validateProfile(input: ProfileInput): ProfileValidation {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const jobTitle = (input.jobTitle ?? "").trim();
  const problems: { name?: string; email?: string; jobTitle?: string } = {};

  if (name.length === 0) {
    problems.name = "Enter your name";
  } else if (name.length > PROFILE_TEXT_MAX_LENGTH) {
    problems.name = `Enter a name of ${PROFILE_TEXT_MAX_LENGTH} characters or fewer`;
  }

  if (email.length === 0) {
    problems.email = "Enter your email address";
  } else if (!EMAIL_PATTERN.test(email)) {
    problems.email =
      "Enter an email address in a valid format, like name@example.com";
  }

  if (jobTitle.length > PROFILE_TEXT_MAX_LENGTH) {
    problems.jobTitle = `Enter a job title of ${PROFILE_TEXT_MAX_LENGTH} characters or fewer`;
  }

  if (Object.keys(problems).length > 0) return { valid: false, problems };
  return { valid: true, profile: { name, email, jobTitle } };
}

/**
 * Where a person may be sent back to once they have signed in (R-4.22): an address inside
 * this service, and only that. Anything that could lead to another site — an absolute
 * address, a protocol-relative one, a backslash a browser reads as a slash — is not a
 * return address, and the person goes to the default destination instead.
 */
export function safeReturnAddress(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//") || value.includes("\\")) return null;
  if (/[\u0000-\u001f]/.test(value)) return null;
  // Returning to the sign-in machinery itself would go round in a circle.
  const path = value.split(/[?#]/)[0] ?? "";
  if (
    path === "/sign-in" ||
    path === "/sign-up" ||
    path === "/sign-out" ||
    path.startsWith("/auth/")
  ) {
    return null;
  }
  return value;
}
