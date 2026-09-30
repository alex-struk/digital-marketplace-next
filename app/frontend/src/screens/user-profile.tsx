import { useSearch } from "@tanstack/react-router";
import { Checkbox, Heading, Link, Text, TextField } from "@bcgov/design-system-react-components";
import { isPublicSector } from "@rules/users";
import type { Account } from "../api/accounts";
import { page, stack } from "../app/layout";
import { NotFound } from "../app/not-found";
import { RequireSignIn } from "../app/require-sign-in";
import { useScreenTitle } from "../app/screen-title";
import { readMoment } from "../lib/dates";

/**
 * The signed-in person's own profile, read-only (user-profile-self, and user-profile for the
 * person's own identifier).
 *
 * Slice 2 needs it so what signing in, finishing signing up and signing out did can be seen:
 * the account a first sign-in made and its kind (R-4.1), the notice choice (R-4.24), the
 * moment the terms were agreed to (R-4.3), and that it sends a visitor to sign in once they
 * have signed out (R-4.17). Editing, the picture, capabilities, organizations, unsubscribing,
 * deactivation and an administrator's view of somebody else are slice 3's and slice 4's
 * (decision record 0016).
 */

export type ProfileSection = "profile" | "capabilities" | "organizations" | "notifications" | "legal";

/** The sections each kind of account is offered, in the order the navigation lists them. */
export function sectionsFor(account: Pick<Account, "type">): readonly ProfileSection[] {
  return isPublicSector(account.type)
    ? ["profile", "notifications"]
    : ["profile", "capabilities", "organizations", "notifications", "legal"];
}

/**
 * The section to show. One the profile does not offer, or one not built yet, shows the
 * profile section instead, with no error (design/DESIGN.md, "A section the profile does not
 * offer").
 */
export function sectionShown(account: Pick<Account, "type">, asked: unknown): ProfileSection {
  const built: readonly ProfileSection[] = ["profile", "notifications", "legal"];
  const offered = sectionsFor(account);
  return typeof asked === "string" &&
    offered.includes(asked as ProfileSection) &&
    built.includes(asked as ProfileSection)
    ? (asked as ProfileSection)
    : "profile";
}

const SECTION_NAMES: Record<ProfileSection, string> = {
  profile: "Profile",
  capabilities: "Capabilities",
  organizations: "Organizations",
  notifications: "Notifications",
  legal: "Legal",
};

const HEADINGS: Record<ProfileSection, string> = {
  profile: "User Profile",
  capabilities: "Capabilities",
  organizations: "My Organizations",
  notifications: "Notifications",
  legal: "Policies, Terms & Agreements",
};

export const ACCOUNT_TYPE_LABELS: Record<Account["type"], string> = {
  VENDOR: "Vendor",
  GOV: "Public sector employee",
  ADMIN: "Public sector employee",
};

const tabs = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--layout-margin-large)",
  listStyle: "none",
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-none)",
} as const;

const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

/** `/users/me`, and `/users/:userId` when the identifier is the signed-in person's own. */
export function UserProfileScreen({ userId }: { userId: string }) {
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  return (
    <RequireSignIn title="User Profile" loadingLabel="Loading your profile…">
      {(account) =>
        userId === "me" || userId === account.id ? (
          <OwnProfile account={account} base={userId === "me" ? "/users/me" : `/users/${account.id}`} asked={search.tab} />
        ) : (
          // Somebody else's profile: only an administrator may read one, and that view is
          // slice 4's. Everybody else is shown the missing page, never a refusal (R-4.25).
          <NotFound />
        )
      }
    </RequireSignIn>
  );
}

function OwnProfile({ account, base, asked }: { account: Account; base: string; asked: unknown }) {
  const section = sectionShown(account, asked);
  useScreenTitle(HEADINGS[section]);
  return (
    <div style={page}>
      <Heading level={1}>{HEADINGS[section]}</Heading>
      <nav aria-label="Profile sections">
        <ul style={tabs}>
          {sectionsFor(account).map((name) => (
            <li key={name}>
              <Link
                href={name === "profile" ? base : `${base}?tab=${name}`}
                aria-current={name === section ? "page" : undefined}
                data-testid={`profile-tab-${name}`}
              >
                {SECTION_NAMES[name]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {section === "notifications" ? (
        <NotificationsSection account={account} base={base} />
      ) : section === "legal" ? (
        <LegalSection account={account} />
      ) : (
        <ProfileSectionView account={account} />
      )}
    </div>
  );
}

const STATUS_LABELS: Record<Account["status"], string> = {
  ACTIVE: "Active",
  INACTIVE_USER: "Inactive",
  INACTIVE_ADMIN: "Inactive",
};

function ProfileSectionView({ account }: { account: Account }) {
  return (
    <>
      <div style={stack}>
        <Text elementType="p">
          Account type: <span data-testid="profile-account-type">{ACCOUNT_TYPE_LABELS[account.type]}</span>
        </Text>
        <Text elementType="p">
          Status:{" "}
          <span style={badge} data-testid="profile-status-badge">
            {STATUS_LABELS[account.status] ?? account.status}
          </span>
        </Text>
        <Text elementType="p" size="small" color="secondary">
          Account ID: <span data-testid="profile-user-identifier">{account.id}</span>
        </Text>
      </div>
      <section aria-labelledby="details-heading" style={stack}>
        <Heading level={2} id="details-heading">
          Details
        </Heading>
        <Text elementType="p" size="small" color="secondary">
          {account.avatarImageFile ? "A profile picture has been added." : "No profile picture has been added."}
        </Text>
        <TextField
          label="Sign-in username"
          value={account.idpUsername}
          isReadOnly
          description="This cannot be changed."
          data-testid="idp-username-field"
        />
        <TextField label="Name" value={account.name} isReadOnly data-testid="name-field" />
        <TextField label="Email address" value={account.email ?? ""} isReadOnly data-testid="email-field" />
        {isPublicSector(account.type) ? (
          <TextField label="Job title" value={account.jobTitle ?? ""} isReadOnly data-testid="job-title-field" />
        ) : null}
      </section>
      {isPublicSector(account.type) ? (
        <section aria-labelledby="permissions-heading" style={stack}>
          <Heading level={2} id="permissions-heading">
            Permissions
          </Heading>
          <Text elementType="p" data-testid="profile-permissions-label">
            {account.type === "ADMIN"
              ? "You have administrator permissions."
              : "You do not have administrator permissions."}
          </Text>
        </section>
      ) : null}
    </>
  );
}

function NotificationsSection({ account, base }: { account: Account; base: string }) {
  return (
    <>
      <Text elementType="p" data-testid="notifications-email-address">
        {account.email ? `Notifications are sent to ${account.email}. ` : "No email address is held for you, so no notifications can be sent. "}
        If this is wrong, <Link href={base}>correct it on your profile</Link>.
      </Text>
      {/* Shown as it stands. Changing it here, and the question asked before notices stop
          (R-4.29), are slice 3's. */}
      <Checkbox
        isSelected={account.notificationsOn !== null}
        isReadOnly
        data-testid="notifications-new-opportunities-checkbox"
      >
        Email me when new opportunities are posted
      </Checkbox>
    </>
  );
}

function LegalSection({ account }: { account: Account }) {
  const agreed = account.acceptedTermsAt ? readMoment(account.acceptedTermsAt) : null;
  const lastAgreed = account.lastAcceptedTermsAt ? readMoment(account.lastAcceptedTermsAt) : null;
  return (
    <>
      <section aria-labelledby="privacy-heading" style={stack} data-testid="legal-privacy-policy">
        <Heading level={2} id="privacy-heading">
          Privacy policy
        </Heading>
        <Text elementType="p">
          <Link href="/content/privacy">Read the Digital Marketplace privacy policy</Link>
        </Text>
        <Text elementType="p">You agreed to this policy when your account was created.</Text>
      </section>
      <section aria-labelledby="terms-heading" style={stack}>
        <Heading level={2} id="terms-heading">
          Terms and conditions
        </Heading>
        <Text elementType="p">
          <Link href="/content/terms-and-conditions" data-testid="legal-app-terms-link">
            Read the Digital Marketplace terms and conditions
          </Link>
        </Text>
        <Text elementType="p" data-testid="legal-accepted-on">
          {agreed ? (
            <>
              You agreed to the terms and conditions on <time dateTime={agreed.dateTime}>{agreed.label}</time>
            </>
          ) : lastAgreed ? (
            <>
              You last agreed to terms and conditions on{" "}
              <time dateTime={lastAgreed.dateTime}>{lastAgreed.label}</time>
            </>
          ) : (
            "You have not agreed to the terms and conditions."
          )}
        </Text>
      </section>
      <section aria-labelledby="program-terms-heading" style={stack}>
        <Heading level={2} id="program-terms-heading">
          Program terms
        </Heading>
        <ul>
          <li>
            <Link href="/content/code-with-us-terms-and-conditions" data-testid="legal-program-terms-link">
              Code With Us terms and conditions
            </Link>
          </li>
          <li>
            <Link href="/content/sprint-with-us-terms-and-conditions" data-testid="legal-program-terms-link">
              Sprint With Us terms and conditions
            </Link>
          </li>
          <li>
            <Link href="/content/team-with-us-terms-and-conditions" data-testid="legal-program-terms-link">
              Team With Us terms and conditions
            </Link>
          </li>
        </ul>
      </section>
    </>
  );
}
