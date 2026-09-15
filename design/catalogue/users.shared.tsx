// The users domain's screens, composed from the B.C. Design System and design tokens.
//
// Every story passes its page's test IDs in as `ids`, written literally in the story, and
// the pieces below render each identifier only where the state being shown has the element
// it names. Nothing here writes a colour, a spacing value, a type size or a radius: every
// such value is a token. Where the design system has no released component for a need (a
// data table, section navigation, a static status label, a file input), the piece below is
// the native element composed with tokens, and design/DESIGN.md records the gap.
//
// All people, addresses and identifiers are synthetic.

import * as React from "react";
import {
  Button,
  ButtonGroup,
  Checkbox,
  CheckboxGroup,
  Dialog,
  Footer,
  Form,
  Header,
  InlineAlert,
  Link,
  Modal,
  TextField,
} from "@bcgov/design-system-react-components";
import * as tokens from "@bcgov/design-tokens/js";
import "@bcgov/bc-sans/css/BC_Sans.css";
import "@bcgov/design-tokens/css/variables.css";

export type TestIds = Readonly<Record<string, string>>;

const tid = (ids: TestIds | undefined, name: string): string | undefined => ids?.[name];

// ------------------------------------------------------------------------------ layout

const stack = (gap: string): React.CSSProperties => ({
  display: "flex",
  flexDirection: "column",
  gap,
});

const flush: React.CSSProperties = { margin: 0 };

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: tokens.typographyFontFamiliesBcSans,
        fontSize: tokens.typographyFontSizeBody,
        color: tokens.typographyColorPrimary,
        background: tokens.surfaceColorBackgroundWhite,
      }}
    >
      <Header
        title="Digital Marketplace"
        skipLinks={[
          <a key="skip-to-main" href="#main-content">
            Skip to main content
          </a>,
        ]}
      />
      <main
        id="main-content"
        tabIndex={-1}
        style={{
          ...stack(tokens.layoutMarginLarge),
          paddingBlock: tokens.layoutPaddingXlarge,
          paddingInline: tokens.layoutPaddingLarge,
        }}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function Row({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-end",
        gap: tokens.layoutMarginMedium,
      }}
    >
      {children}
    </div>
  );
}

export function PageHeading({ children }: { children: React.ReactNode }) {
  return (
    <h1
      style={{
        ...flush,
        fontSize: tokens.typographyFontSizeH1,
        fontWeight: tokens.typographyFontWeightsBold,
      }}
    >
      {children}
    </h1>
  );
}

export function SectionHeading({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      style={{
        ...flush,
        fontSize: tokens.typographyFontSizeH2,
        fontWeight: tokens.typographyFontWeightsBold,
      }}
    >
      {children}
    </h2>
  );
}

export function SubsectionHeading({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3
      id={id}
      style={{
        ...flush,
        fontSize: tokens.typographyFontSizeH3,
        fontWeight: tokens.typographyFontWeightsBold,
      }}
    >
      {children}
    </h3>
  );
}

export function Paragraph({
  children,
  ...rest
}: React.HTMLAttributes<HTMLParagraphElement> & { "data-testid"?: string }) {
  return (
    <p {...rest} style={flush}>
      {children}
    </p>
  );
}

// A static label. The words carry the meaning; the tone only reinforces it.
export function StatusLabel({
  tone,
  children,
  ...rest
}: { tone: "success" | "danger"; children: React.ReactNode; "data-testid"?: string }) {
  return (
    <span
      {...rest}
      style={{
        display: "inline-block",
        paddingBlock: tokens.layoutPaddingXsmall,
        paddingInline: tokens.layoutPaddingSmall,
        border: `${tokens.layoutBorderWidthSmall} solid ${
          tone === "success" ? tokens.supportBorderColorSuccess : tokens.supportBorderColorDanger
        }`,
        borderRadius: tokens.layoutBorderRadiusSmall,
        background:
          tone === "success" ? tokens.supportSurfaceColorSuccess : tokens.supportSurfaceColorDanger,
        fontSize: tokens.typographyFontSizeSmallBody,
        fontWeight: tokens.typographyFontWeightsBold,
      }}
    >
      {children}
    </span>
  );
}

// The thinnest border token doubles as the one-unit box a visually hidden element needs,
// so that no raw length is written.
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        position: "absolute",
        width: tokens.layoutBorderWidthSmall,
        height: tokens.layoutBorderWidthSmall,
        overflow: "hidden",
        clipPath: "inset(50%)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export function LoadingStatus({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" style={{ ...flush, color: tokens.typographyColorSecondary }}>
      {children}
    </p>
  );
}

// ------------------------------------------------------------------------------ forms

export type FieldErrors = { name?: string; email?: string };

// Shown above a form after a failed submission; the build moves focus here on submit. Each
// entry links to the field it describes, which carries the same message inline.
export function ErrorSummary({ ids, errors }: { ids?: TestIds; errors: FieldErrors }) {
  return (
    <div tabIndex={-1} aria-labelledby="error-summary-heading">
      <InlineAlert variant="danger">
        <SubsectionHeading id="error-summary-heading">There is a problem with this form</SubsectionHeading>
        <ul style={{ marginBlock: tokens.layoutMarginSmall }}>
          {errors.name ? (
            <li data-testid={tid(ids, "field_error")}>
              <Link href="#profile-name">{errors.name}</Link>
            </li>
          ) : null}
          {errors.email ? (
            <li data-testid={tid(ids, "field_error")}>
              <Link href="#profile-email">{errors.email}</Link>
            </li>
          ) : null}
        </ul>
      </InlineAlert>
    </div>
  );
}

// The profile picture. No released file-input component exists, so the editable form is a
// native file input with a persistent label. The initials are decorative: the person's name
// is already on the screen, so they are hidden from assistive technology.
export function AvatarField({
  initials,
  isEditable,
  ...rest
}: { initials: string; isEditable: boolean; "data-testid"?: string }) {
  return (
    <Row>
      <span
        aria-hidden="true"
        style={{
          padding: tokens.layoutPaddingLarge,
          borderRadius: tokens.layoutBorderRadiusLarge,
          background: tokens.surfaceColorBackgroundLightGray,
          fontSize: tokens.typographyFontSizeH3,
          fontWeight: tokens.typographyFontWeightsBold,
        }}
      >
        {initials}
      </span>
      {isEditable ? (
        <div style={stack(tokens.layoutMarginXsmall)}>
          <label htmlFor="profile-picture">Profile picture (optional)</label>
          <span id="profile-picture-description" style={{ color: tokens.typographyColorSecondary }}>
            Choose an image file.
          </span>
          <input
            {...rest}
            id="profile-picture"
            type="file"
            accept="image/*"
            aria-describedby="profile-picture-description"
          />
        </div>
      ) : null}
    </Row>
  );
}

// ------------------------------------------------------------------------------ people

export type Person = {
  kind: "vendor" | "public-sector" | "administrator";
  name: string;
  initials: string;
  email: string;
  idpLabel: string;
  idpUsername: string;
  typeLabel: string;
  jobTitle?: string;
  id: string;
};

export const SAMPLE_VENDOR: Person = {
  kind: "vendor",
  name: "Sample Vendor One",
  initials: "SV",
  email: "vendor.one@example.com",
  idpLabel: "GitHub username",
  idpUsername: "sample-vendor-one",
  typeLabel: "Vendor",
  id: "8c1f4e2a-3b7d-4c9e-9a51-2d6f0b7e4a10",
};

export const SAMPLE_INACTIVE_VENDOR: Person = {
  ...SAMPLE_VENDOR,
  name: "Sample Vendor Five",
  email: "vendor.five@example.com",
  idpUsername: "sample-vendor-five",
  id: "e7a2c4d9-6b1f-4a38-9e05-3c8d2f1b7a64",
};

export const SAMPLE_PUBLIC_SERVANT: Person = {
  kind: "public-sector",
  name: "Sample Public Servant",
  initials: "SP",
  email: "public.servant@example.com",
  idpLabel: "IDIR username",
  idpUsername: "SAMPLEPS",
  typeLabel: "Public Sector Employee",
  jobTitle: "Procurement Analyst",
  id: "2b9d7c61-5e4a-4f3b-8d20-7c1e9a6b5f32",
};

export const SAMPLE_ADMINISTRATOR: Person = {
  kind: "administrator",
  name: "Sample Administrator",
  initials: "SA",
  email: "administrator@example.com",
  idpLabel: "IDIR username",
  idpUsername: "SAMPLEADM",
  typeLabel: "Administrator",
  jobTitle: "Service Administrator",
  id: "5d3a8f10-9c2b-4e71-a6d4-1b8e0f7c2a93",
};

export const INVALID_PROFILE_ERRORS: FieldErrors = {
  name: "Enter your name, up to 100 characters.",
  email: "Enter an email address in the format name@example.com.",
};

// ------------------------------------------------------------------------------ sign-in cards

// Choosing a kind of account navigates to the identity provider, so each choice is a link.
export function AccountChoices({
  ids,
  verb,
  vendorAction,
  publicSectorAction,
}: {
  ids?: TestIds;
  verb: "Sign in" | "Sign up";
  vendorAction?: string;
  publicSectorAction?: string;
}) {
  const card: React.CSSProperties = {
    ...stack(tokens.layoutMarginMedium),
    padding: tokens.layoutPaddingLarge,
    border: `${tokens.layoutBorderWidthSmall} solid ${tokens.surfaceColorBorderDefault}`,
    borderRadius: tokens.layoutBorderRadiusMedium,
  };
  return (
    <div style={stack(tokens.layoutMarginLarge)}>
      <section aria-labelledby="vendor-heading" style={card} data-testid={tid(ids, "vendor_card")}>
        <SectionHeading id="vendor-heading">Vendor</SectionHeading>
        <Paragraph>For people and organizations who want to find opportunities and submit proposals.</Paragraph>
        <Link href="/auth/sign-in?kind=vendor" data-testid={vendorAction && tid(ids, vendorAction)}>
          {verb} using GitHub
        </Link>
      </section>
      <section
        aria-labelledby="public-sector-heading"
        style={card}
        data-testid={tid(ids, "public_sector_card")}
      >
        <SectionHeading id="public-sector-heading">Public Sector Employee</SectionHeading>
        <Paragraph>For B.C. public sector employees who want to publish and manage opportunities.</Paragraph>
        <Link
          href="/auth/sign-in?kind=public-sector-employee"
          data-testid={publicSectorAction && tid(ids, publicSectorAction)}
        >
          {verb} using IDIR
        </Link>
      </section>
    </div>
  );
}

// ------------------------------------------------------------------------------ profile

export type ProfileSection = "profile" | "capabilities" | "organizations" | "notifications" | "legal";

const SECTION_LABELS: Record<ProfileSection, string> = {
  profile: "Profile",
  capabilities: "Capabilities",
  organizations: "Organizations",
  notifications: "Notifications",
  legal: "Legal",
};

// R-4.34: a vendor's own profile offers five sections, a public sector employee's (and an
// administrator's) two, and an administrator looking at somebody else's the profile alone.
const sectionsFor = (person: Person, viewer: "own" | "other"): ProfileSection[] =>
  viewer === "other"
    ? []
    : person.kind === "vendor"
      ? ["profile", "capabilities", "organizations", "notifications", "legal"]
      : ["profile", "notifications"];

export type Activation = "deactivate-own" | "deactivate-other" | "reactivate" | "owner-deactivated";

export function ProfileScreen({
  ids,
  person,
  viewer,
  addressedAsMe = false,
  section = "profile",
  mode = "view",
  errors,
  saveFailed = false,
  adminPermission,
  activation,
  showStatus = false,
  status = "Active",
  dialog,
  children,
}: {
  ids?: TestIds;
  person: Person;
  viewer: "own" | "other";
  addressedAsMe?: boolean;
  section?: ProfileSection;
  mode?: "view" | "edit";
  errors?: FieldErrors;
  saveFailed?: boolean;
  adminPermission?: { isSelected: boolean; refused?: boolean };
  activation?: Activation;
  showStatus?: boolean;
  status?: "Active" | "Inactive";
  dialog?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const base = addressedAsMe ? "/users/me" : `/users/${person.id}`;
  const sections = sectionsFor(person, viewer);
  return (
    <>
      <PageHeading>{person.name}</PageHeading>
      <dl style={{ display: "flex", flexWrap: "wrap", gap: tokens.layoutMarginLarge, margin: 0 }}>
        <SummaryItem term="Account type">
          <span data-testid={tid(ids, "account_type")}>{person.typeLabel}</span>
        </SummaryItem>
        {showStatus ? (
          <SummaryItem term="Status">
            <StatusLabel tone={status === "Active" ? "success" : "danger"} data-testid={tid(ids, "status_badge")}>
              {status}
            </StatusLabel>
          </SummaryItem>
        ) : null}
        <SummaryItem term="Account ID">
          <span data-testid={tid(ids, "user_identifier")}>{person.id}</span>
        </SummaryItem>
      </dl>

      {sections.length > 0 ? (
        <nav aria-label="Profile sections">
          <ul
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: tokens.layoutMarginLarge,
              margin: 0,
              padding: 0,
              listStyle: "none",
              borderBottom: `${tokens.layoutBorderWidthSmall} solid ${tokens.surfaceColorBorderDefault}`,
            }}
          >
            {sections.map((s) => (
              <li key={s}>
                <a
                  href={s === "profile" ? base : `${base}?tab=${s}`}
                  aria-current={s === section ? "page" : undefined}
                  data-testid={tid(ids, `${s}_tab`)}
                  style={{
                    display: "inline-block",
                    paddingBlock: tokens.layoutPaddingSmall,
                    color: s === section ? tokens.typographyColorPrimary : tokens.typographyColorLink,
                    fontWeight:
                      s === section ? tokens.typographyFontWeightsBold : tokens.typographyFontWeightsRegular,
                    borderBottom:
                      s === section
                        ? `${tokens.layoutBorderWidthLarge} solid ${tokens.surfaceColorBorderActive}`
                        : undefined,
                  }}
                >
                  {SECTION_LABELS[s]}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {section === "profile" ? (
        <section aria-labelledby="section-heading" style={stack(tokens.layoutMarginLarge)}>
          <SectionHeading id="section-heading">Profile</SectionHeading>
          {mode === "edit" ? (
            <ProfileForm ids={ids} person={person} errors={errors} saveFailed={saveFailed} />
          ) : (
            <ProfileDetails ids={ids} person={person} canEdit={viewer === "own"} />
          )}
          <Permissions ids={ids} person={person} viewer={viewer} adminPermission={adminPermission} />
          {mode === "view" && activation ? <AccountStatus ids={ids} activation={activation} /> : null}
        </section>
      ) : (
        children
      )}

      {dialog}
    </>
  );
}

function SummaryItem({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt style={{ color: tokens.typographyColorSecondary, fontSize: tokens.typographyFontSizeSmallBody }}>
        {term}
      </dt>
      <dd style={flush}>{children}</dd>
    </div>
  );
}

// R-4.27: the sign-in username is always read-only. R-4.28: only a public sector employee's
// profile carries a job title.
function ProfileDetails({ ids, person, canEdit }: { ids?: TestIds; person: Person; canEdit: boolean }) {
  return (
    <div style={stack(tokens.layoutMarginMedium)}>
      <AvatarField initials={person.initials} isEditable={false} />
      <TextField
        label={person.idpLabel}
        value={person.idpUsername}
        isReadOnly
        description="The username you sign in with. It cannot be changed."
        data-testid={tid(ids, "idp_username_readonly")}
      />
      <TextField label="Name" value={person.name} isReadOnly data-testid={tid(ids, "name_field")} />
      <TextField
        label="Email address"
        type="email"
        value={person.email}
        isReadOnly
        data-testid={tid(ids, "email_field")}
      />
      {person.jobTitle !== undefined ? (
        <TextField label="Job title" value={person.jobTitle} isReadOnly data-testid={tid(ids, "job_title_field")} />
      ) : null}
      {canEdit ? (
        <ButtonGroup>
          <Button variant="secondary" data-testid={tid(ids, "edit_profile")}>
            Edit profile
          </Button>
        </ButtonGroup>
      ) : null}
    </div>
  );
}

function ProfileForm({
  ids,
  person,
  errors,
  saveFailed,
}: {
  ids?: TestIds;
  person: Person;
  errors?: FieldErrors;
  saveFailed: boolean;
}) {
  return (
    <div style={stack(tokens.layoutMarginMedium)}>
      {errors ? <ErrorSummary ids={ids} errors={errors} /> : null}
      {saveFailed ? (
        <div role="alert">
          <InlineAlert
            variant="danger"
            title="Your changes were not saved"
            description="Something went wrong while saving your profile. Check your details and try again."
          />
        </div>
      ) : null}
      <Form aria-labelledby="section-heading" validationBehavior="aria" style={stack(tokens.layoutMarginMedium)}>
        <AvatarField initials={person.initials} isEditable data-testid={tid(ids, "change_avatar")} />
        <TextField
          label={person.idpLabel}
          value={person.idpUsername}
          isReadOnly
          description="The username you sign in with. It cannot be changed."
          data-testid={tid(ids, "idp_username_readonly")}
        />
        <TextField
          id="profile-name"
          label="Name"
          isRequired
          value={errors?.name ? "" : person.name}
          description="Up to 100 characters."
          isInvalid={Boolean(errors?.name)}
          errorMessage={errors?.name}
          data-testid={tid(ids, "name_field")}
        />
        <TextField
          id="profile-email"
          label="Email address"
          type="email"
          isRequired
          value={errors?.email ? "vendor.one@example" : person.email}
          isInvalid={Boolean(errors?.email)}
          errorMessage={errors?.email}
          data-testid={tid(ids, "email_field")}
        />
        {person.jobTitle !== undefined ? (
          <TextField
            id="profile-job-title"
            label="Job title (optional)"
            value={person.jobTitle}
            description="Up to 100 characters."
            data-testid={tid(ids, "job_title_field")}
          />
        ) : null}
        <ButtonGroup>
          <Button type="submit" variant="primary" data-testid={tid(ids, "save_changes")}>
            Save changes
          </Button>
          <Button variant="tertiary" data-testid={tid(ids, "cancel_editing")}>
            Cancel
          </Button>
        </ButtonGroup>
      </Form>
    </div>
  );
}

// R-4.12: an administrator viewing somebody else's account is offered the administrator box
// (applied at once); a public sector employee or administrator viewing their own sees a
// read-only label; a vendor viewing their own sees neither.
function Permissions({
  ids,
  person,
  viewer,
  adminPermission,
}: {
  ids?: TestIds;
  person: Person;
  viewer: "own" | "other";
  adminPermission?: { isSelected: boolean; refused?: boolean };
}) {
  if (viewer === "own" && person.kind === "vendor") return null;
  if (viewer === "other" && !adminPermission) return null;
  return (
    <section aria-labelledby="permissions-heading" style={stack(tokens.layoutMarginSmall)}>
      <SubsectionHeading id="permissions-heading">Permissions</SubsectionHeading>
      {viewer === "own" ? (
        <Paragraph data-testid={tid(ids, "permissions_label")}>
          {person.kind === "administrator" ? "Administrator" : "Public Sector Employee"}
        </Paragraph>
      ) : (
        <>
          <Paragraph>A change to administrator permissions takes effect as soon as the box is ticked or cleared.</Paragraph>
          <div data-testid={tid(ids, "admin_checkbox")}>
            <Checkbox
              value="administrator"
              isSelected={adminPermission?.isSelected}
              data-testid={tid(ids, "toggle_admin_permission")}
            >
              Administrator
            </Checkbox>
          </div>
          {adminPermission?.refused ? (
            <div role="alert">
              <InlineAlert
                variant="danger"
                title="Administrator permissions not granted"
                description="Vendors cannot be granted administrator permissions."
              />
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

// R-4.9, R-4.19, R-4.30, R-4.31.
function AccountStatus({ ids, activation }: { ids?: TestIds; activation: Activation }) {
  return (
    <section aria-labelledby="account-status-heading" style={stack(tokens.layoutMarginSmall)}>
      <SubsectionHeading id="account-status-heading">Account status</SubsectionHeading>
      {activation === "deactivate-own" ? (
        <>
          <Paragraph>
            Deactivating your account signs you out straight away. You can reactivate it at any time by signing in again.
          </Paragraph>
          <ButtonGroup>
            <Button variant="primary" danger data-testid={tid(ids, "deactivate_account")}>
              Deactivate account
            </Button>
          </ButtonGroup>
        </>
      ) : null}
      {activation === "deactivate-other" ? (
        <>
          <Paragraph>
            A deactivated account cannot be used to sign in. The person is told by email that their access has been removed.
          </Paragraph>
          <ButtonGroup>
            <Button variant="primary" danger data-testid={tid(ids, "deactivate_account")}>
              Deactivate account
            </Button>
          </ButtonGroup>
        </>
      ) : null}
      {activation === "reactivate" ? (
        <>
          <Paragraph>An administrator deactivated this account on August 28, 2026.</Paragraph>
          <ButtonGroup>
            <Button variant="primary" data-testid={tid(ids, "reactivate_account")}>
              Reactivate account
            </Button>
          </ButtonGroup>
        </>
      ) : null}
      {activation === "owner-deactivated" ? (
        <InlineAlert
          variant="info"
          title="Deactivated by the account owner"
          description="This person deactivated their own account on August 28, 2026. Only they can reactivate it, by signing in again."
        />
      ) : null}
    </section>
  );
}

// ------------------------------------------------------------------------------ dialogs

// A confirmation: role alertdialog, focus starts on Cancel, Escape cancels, focus returns
// to the control that opened it. One wrapper holds heading, text and buttons, so a single
// identifier scopes everything the dialog offers.
function ConfirmDialog({
  testId,
  headingId,
  heading,
  description,
  cancelTestId,
  confirmTestId,
  confirmLabel,
  danger = false,
}: {
  testId?: string;
  headingId: string;
  heading: string;
  description: React.ReactNode;
  cancelTestId?: string;
  confirmTestId?: string;
  confirmLabel: string;
  danger?: boolean;
}) {
  return (
    <Modal isOpen isDismissable={false}>
      <Dialog role="alertdialog" aria-labelledby={headingId} aria-describedby={`${headingId}-description`}>
        <div
          data-testid={testId}
          style={{ ...stack(tokens.layoutMarginMedium), padding: tokens.layoutPaddingLarge }}
        >
          <SectionHeading id={headingId}>{heading}</SectionHeading>
          <p id={`${headingId}-description`} style={flush}>
            {description}
          </p>
          <ButtonGroup>
            <Button variant="tertiary" slot="close" autoFocus data-testid={cancelTestId}>
              Cancel
            </Button>
            <Button variant="primary" danger={danger} data-testid={confirmTestId}>
              {confirmLabel}
            </Button>
          </ButtonGroup>
        </div>
      </Dialog>
    </Modal>
  );
}

export function ActivationDialog({
  ids,
  kind,
}: {
  ids?: TestIds;
  kind: "deactivate-own" | "deactivate-other" | "reactivate";
}) {
  const copy = {
    "deactivate-own": {
      heading: "Deactivate your account?",
      description:
        "You will be signed out straight away and sent an email telling you how to come back. You can reactivate your account at any time by signing in again.",
      confirm: "Deactivate account",
    },
    "deactivate-other": {
      heading: "Deactivate this account?",
      description:
        "Sample Public Servant will no longer be able to sign in and will be told by email that an administrator has removed their access.",
      confirm: "Deactivate account",
    },
    reactivate: {
      heading: "Reactivate this account?",
      description:
        "Sample Vendor Five will be able to sign in again and will be told by email that an administrator has reactivated their account.",
      confirm: "Reactivate account",
    },
  }[kind];
  return (
    <ConfirmDialog
      testId={tid(ids, "activation_modal")}
      headingId="activation-heading"
      heading={copy.heading}
      description={copy.description}
      cancelTestId={tid(ids, "cancel_activation_change")}
      confirmTestId={tid(ids, "confirm_activation_change")}
      confirmLabel={copy.confirm}
      danger={kind !== "reactivate"}
    />
  );
}

export function UnsubscribeDialog({ ids, email }: { ids?: TestIds; email: string }) {
  return (
    <ConfirmDialog
      testId={tid(ids, "unsubscribe_modal")}
      headingId="unsubscribe-heading"
      heading="Stop new opportunity notifications?"
      description={`Are you sure you want to stop sending notifications about new opportunities to ${email}?`}
      cancelTestId={tid(ids, "cancel_unsubscribe")}
      confirmTestId={tid(ids, "confirm_unsubscribe")}
      confirmLabel="Stop notifications"
    />
  );
}

export function AcceptTermsDialog({ ids }: { ids?: TestIds }) {
  return (
    <ConfirmDialog
      testId={tid(ids, "accept_updated_terms_modal")}
      headingId="accept-terms-heading"
      heading="Agree to the updated terms and conditions?"
      description={
        <>
          The Digital Marketplace Terms &amp; Conditions have changed.{" "}
          <Link href="/content/terms-and-conditions" target="_blank">
            Read the updated terms (opens in a new tab)
          </Link>
          . Agreeing records today&apos;s date and time on your account.
        </>
      }
      confirmTestId={tid(ids, "confirm_accept_updated_terms")}
      confirmLabel="Agree to the updated terms"
    />
  );
}

// ------------------------------------------------------------------------------ profile sections

export const CAPABILITIES: ReadonlyArray<{ value: string; label: string; description: string }> = [
  { value: "agile-coaching", label: "Agile Coaching", description: "Helps a team adopt and improve agile ways of working." },
  { value: "backend-development", label: "Backend Development", description: "Builds the services, data stores and interfaces behind an application." },
  { value: "delivery-management", label: "Delivery Management", description: "Plans a team's delivery of working software and clears what is in its way." },
  { value: "devops-engineering", label: "DevOps Engineering", description: "Automates how software is built, tested, deployed and operated." },
  { value: "frontend-development", label: "Frontend Development", description: "Builds the parts of an application people see and use." },
  { value: "security-engineering", label: "Security Engineering", description: "Designs and tests the protections an application needs." },
  { value: "technical-architecture", label: "Technical Architecture", description: "Shapes the structure of a system and the decisions behind it." },
  { value: "user-experience-design", label: "User Experience Design", description: "Designs how people move through and use a service." },
  { value: "user-research", label: "User Research", description: "Learns what people need from a service by working with them." },
];

// R-4.8: each capability is turned on or off on its own and saved as it changes; each
// carries a description the person can expand first.
export function CapabilitiesSection({
  ids,
  held,
  expanded,
}: {
  ids?: TestIds;
  held: ReadonlyArray<string>;
  expanded?: string;
}) {
  return (
    <section aria-labelledby="section-heading" style={stack(tokens.layoutMarginMedium)}>
      <SectionHeading id="section-heading">Capabilities</SectionHeading>
      <p id="capabilities-intro" style={flush}>
        Tick each capability you have. Each change is saved as soon as you make it. You may leave every box clear.
      </p>
      <ul
        aria-describedby="capabilities-intro"
        style={{ ...stack(tokens.layoutMarginMedium), margin: 0, padding: 0, listStyle: "none" }}
      >
        {CAPABILITIES.map((c) => {
          const isExpanded = c.value === expanded;
          return (
            <li key={c.value} data-testid={tid(ids, "capability_row")} style={stack(tokens.layoutMarginXsmall)}>
              <span data-testid={tid(ids, "capability_checked")}>
                <Checkbox
                  value={c.value}
                  isSelected={held.includes(c.value)}
                  data-testid={tid(ids, "toggle_capability")}
                >
                  {c.label}
                </Checkbox>
              </span>
              <Button
                variant="link"
                size="small"
                aria-expanded={isExpanded}
                aria-controls={`capability-description-${c.value}`}
                data-testid={tid(ids, "expand_capability_description")}
              >
                {isExpanded ? "Hide" : "Show"} description
                <VisuallyHidden> of {c.label}</VisuallyHidden>
              </Button>
              <p
                id={`capability-description-${c.value}`}
                hidden={!isExpanded}
                style={flush}
                data-testid={tid(ids, "capability_description")}
              >
                {c.description}
              </p>
            </li>
          );
        })}
      </ul>
      <p role="status" style={flush} />
    </section>
  );
}

// R-4.29: the section names the address notifications go to; there is no other address.
export function NotificationsSection({
  ids,
  email,
  isSelected,
}: {
  ids?: TestIds;
  email: string;
  isSelected: boolean;
}) {
  return (
    <section aria-labelledby="section-heading" style={stack(tokens.layoutMarginMedium)}>
      <SectionHeading id="section-heading">Notifications</SectionHeading>
      <Paragraph>
        Notifications are sent to <strong data-testid={tid(ids, "notification_email_address")}>{email}</strong>. If this
        address is not correct, change it in the Profile section.
      </Paragraph>
      <div data-testid={tid(ids, "new_opportunities_checkbox")}>
        <Checkbox
          value="new-opportunities"
          isSelected={isSelected}
          data-testid={tid(ids, "toggle_new_opportunity_notifications")}
        >
          Notify me by email when a new opportunity is published
        </Checkbox>
      </div>
      <p role="status" style={flush} />
    </section>
  );
}

// R-4.16, R-4.33.
export function LegalSection({ ids, termsUpdated }: { ids?: TestIds; termsUpdated: boolean }) {
  return (
    <section aria-labelledby="section-heading" style={stack(tokens.layoutMarginLarge)}>
      <SectionHeading id="section-heading">Policies, Terms &amp; Agreements</SectionHeading>
      {termsUpdated ? (
        <div data-testid={tid(ids, "terms_updated_warning")}>
          <InlineAlert
            variant="warning"
            title="The terms and conditions have been updated"
            description="Review and agree to the updated Digital Marketplace Terms & Conditions to continue."
          />
        </div>
      ) : null}
      <section
        aria-labelledby="privacy-heading"
        style={stack(tokens.layoutMarginSmall)}
        data-testid={tid(ids, "privacy_policy")}
      >
        <SubsectionHeading id="privacy-heading">Privacy Policy</SubsectionHeading>
        <Paragraph>
          [Privacy policy text, supplied as content.] You agreed to this privacy policy when your account was created.
        </Paragraph>
      </section>
      <section aria-labelledby="app-terms-heading" style={stack(tokens.layoutMarginSmall)}>
        <SubsectionHeading id="app-terms-heading">Digital Marketplace Terms &amp; Conditions</SubsectionHeading>
        <Paragraph data-testid={tid(ids, "app_terms_link")}>
          <Link href="/content/terms-and-conditions" data-testid={tid(ids, "open_app_terms")}>
            Read the Digital Marketplace Terms &amp; Conditions
          </Link>
        </Paragraph>
        <Paragraph data-testid={tid(ids, "accepted_on_notice")}>
          {termsUpdated
            ? "You last agreed to the Digital Marketplace Terms & Conditions on March 3, 2026 at 9:40 AM. You have not yet agreed to the updated terms."
            : "You agreed to the Digital Marketplace Terms & Conditions on March 3, 2026 at 9:40 AM."}
        </Paragraph>
        {termsUpdated ? (
          <ButtonGroup>
            <Button variant="primary" data-testid={tid(ids, "accept_updated_terms")}>
              Review and agree to the updated terms
            </Button>
          </ButtonGroup>
        ) : null}
      </section>
      <section aria-labelledby="program-terms-heading" style={stack(tokens.layoutMarginSmall)}>
        <SubsectionHeading id="program-terms-heading">Program Terms &amp; Conditions</SubsectionHeading>
        <ul style={flush} data-testid={tid(ids, "program_terms_links")}>
          <li>
            <Link href="/content/code-with-us-terms-and-conditions">Code With Us Terms &amp; Conditions</Link>
          </li>
          <li>
            <Link href="/content/sprint-with-us-terms-and-conditions">Sprint With Us Terms &amp; Conditions</Link>
          </li>
          <li>
            <Link href="/content/team-with-us-terms-and-conditions">Team With Us Terms &amp; Conditions</Link>
          </li>
        </ul>
      </section>
    </section>
  );
}

// ------------------------------------------------------------------------------ sign-up completion

// R-4.3, R-4.24, R-4.27, R-4.28: a vendor confirms their details, may opt in to notices, and
// cannot complete until they agree to the terms. The completion button stays unavailable
// until then, and the sentence explaining why is its accessible description.
export function CompleteProfileForm({
  ids,
  termsAccepted,
  errors,
}: {
  ids?: TestIds;
  termsAccepted: boolean;
  errors?: FieldErrors;
}) {
  const person = SAMPLE_VENDOR;
  return (
    <>
      <PageHeading>Complete Your Profile</PageHeading>
      <Paragraph>Check the details your sign-in provided and agree to the terms to finish creating your account.</Paragraph>
      {errors ? <ErrorSummary ids={ids} errors={errors} /> : null}
      <Form aria-label="Complete your profile" validationBehavior="aria" style={stack(tokens.layoutMarginMedium)}>
        <AvatarField initials={person.initials} isEditable data-testid={tid(ids, "change_avatar")} />
        <TextField
          label={person.idpLabel}
          value={person.idpUsername}
          isReadOnly
          description="The username you sign in with. It cannot be changed."
          data-testid={tid(ids, "idp_username_readonly")}
        />
        <TextField
          id="profile-name"
          label="Name"
          isRequired
          value={errors?.name ? "" : person.name}
          description="Up to 100 characters."
          isInvalid={Boolean(errors?.name)}
          errorMessage={errors?.name}
          data-testid={tid(ids, "name_field")}
        />
        <TextField
          id="profile-email"
          label="Email address"
          type="email"
          isRequired
          value={errors?.email ? "vendor.one@example" : person.email}
          isInvalid={Boolean(errors?.email)}
          errorMessage={errors?.email}
          data-testid={tid(ids, "email_field")}
        />
        <CheckboxGroup label="Notifications">
          <Checkbox value="new-opportunities" data-testid={tid(ids, "toggle_new_opportunity_notifications")}>
            Notify me by email when a new opportunity is published
          </Checkbox>
        </CheckboxGroup>
        <section aria-labelledby="terms-heading" style={stack(tokens.layoutMarginSmall)}>
          <SubsectionHeading id="terms-heading">Terms and conditions</SubsectionHeading>
          <Paragraph>
            Read the <Link href="/content/terms-and-conditions">Digital Marketplace Terms &amp; Conditions</Link> and the{" "}
            <Link href="/content/privacy">Privacy Policy</Link>.
          </Paragraph>
          <div data-testid={tid(ids, "terms_checkbox")}>
            <Checkbox value="agree" isRequired isSelected={termsAccepted} data-testid={tid(ids, "accept_app_terms")}>
              I have read and agree to the Digital Marketplace Terms &amp; Conditions and the Privacy Policy
            </Checkbox>
          </div>
        </section>
        {termsAccepted ? null : (
          <p id="complete-requirement" style={flush} data-testid={tid(ids, "complete_disabled_until_terms_accepted")}>
            Agree to the terms and conditions and the privacy policy to complete your profile.
          </p>
        )}
        <ButtonGroup>
          <Button
            type="submit"
            variant="primary"
            isDisabled={!termsAccepted}
            aria-describedby={termsAccepted ? undefined : "complete-requirement"}
            data-testid={tid(ids, "complete_profile")}
          >
            Complete profile
          </Button>
        </ButtonGroup>
      </Form>
    </>
  );
}

// ------------------------------------------------------------------------------ user list

const USER_ROWS = [
  { status: "Active", type: "Administrator", person: SAMPLE_ADMINISTRATOR, isAdmin: true },
  { status: "Active", type: "Public Sector Employee", person: SAMPLE_PUBLIC_SERVANT, isAdmin: false },
  { status: "Active", type: "Vendor", person: SAMPLE_VENDOR, isAdmin: false },
  { status: "Inactive", type: "Vendor", person: SAMPLE_INACTIVE_VENDOR, isAdmin: false },
] as const;

const cell: React.CSSProperties = {
  textAlign: "start",
  paddingBlock: tokens.layoutPaddingSmall,
  paddingInline: tokens.layoutPaddingSmall,
  borderBottom: `${tokens.layoutBorderWidthSmall} solid ${tokens.surfaceColorBorderDefault}`,
};

// R-4.14: searching narrows by name only, as the person types.
export function UserListToolbar({ ids }: { ids?: TestIds }) {
  return (
    <Row>
      <TextField
        label="Search by name"
        type="search"
        description="Matches any words in a person's name."
        data-testid={tid(ids, "search_by_name")}
      />
      <Button variant="secondary" data-testid={tid(ids, "open_export_contact_list")}>
        Export contact list
      </Button>
    </Row>
  );
}

// R-4.14: status, then account type, then name. The design system has no released table, so
// this is a native table: caption, column headers with scope, horizontal scroll when narrow.
export function UserTable({ ids }: { ids?: TestIds }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <caption style={{ textAlign: "start", paddingBlock: tokens.layoutPaddingSmall }}>
          Everyone registered with the Digital Marketplace. Active accounts are listed first.
        </caption>
        <thead>
          <tr>
            {["Status", "Account type", "Name", "Administrator"].map((h) => (
              <th key={h} scope="col" style={{ ...cell, fontWeight: tokens.typographyFontWeightsBold }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {USER_ROWS.map((row) => (
            <tr key={row.person.id} data-testid={tid(ids, "user_row")}>
              <td style={cell}>
                <StatusLabel
                  tone={row.status === "Active" ? "success" : "danger"}
                  data-testid={tid(ids, "status_badge")}
                >
                  {row.status}
                </StatusLabel>
              </td>
              <td style={cell}>
                <span data-testid={tid(ids, "account_type")}>{row.type}</span>
              </td>
              <td style={cell}>
                <Link href={`/users/${row.person.id}`} data-testid={tid(ids, "open_user_profile")}>
                  {row.person.name}
                </Link>
              </td>
              <td style={cell}>
                {row.isAdmin ? <span data-testid={tid(ids, "admin_check")}>Yes</span> : "No"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// R-4.32: at least one account type and one field before Export is available.
export function ExportDialog({ ids, ready }: { ids?: TestIds; ready: boolean }) {
  return (
    <Modal isOpen isDismissable>
      <Dialog aria-labelledby="export-heading">
        <div
          data-testid={tid(ids, "export_modal")}
          style={{ ...stack(tokens.layoutMarginMedium), padding: tokens.layoutPaddingLarge }}
        >
          <SectionHeading id="export-heading">Export contact list</SectionHeading>
          <Paragraph>Download the contact details of active accounts as a spreadsheet file.</Paragraph>
          <CheckboxGroup
            label="Account types"
            description="Administrators are included with public sector employees."
            value={ready ? ["public-sector"] : []}
          >
            <Checkbox value="public-sector" data-testid={tid(ids, "toggle_export_user_type")}>
              Public sector employees
            </Checkbox>
            <Checkbox value="vendor" data-testid={tid(ids, "toggle_export_user_type")}>
              Vendors
            </Checkbox>
          </CheckboxGroup>
          <CheckboxGroup label="Fields" value={ready ? ["email"] : []}>
            <Checkbox value="first-name" data-testid={tid(ids, "toggle_export_field")}>
              First name
            </Checkbox>
            <Checkbox value="last-name" data-testid={tid(ids, "toggle_export_field")}>
              Last name
            </Checkbox>
            <Checkbox value="email" data-testid={tid(ids, "toggle_export_field")}>
              Email address
            </Checkbox>
            <Checkbox value="organization-name" data-testid={tid(ids, "toggle_export_field")}>
              Organization name
            </Checkbox>
          </CheckboxGroup>
          {ready ? null : (
            <p id="export-requirement" style={flush} data-testid={tid(ids, "export_disabled_until_selection")}>
              Choose at least one account type and at least one field to export.
            </p>
          )}
          <ButtonGroup>
            <Button variant="tertiary" slot="close" data-testid={tid(ids, "cancel_export")}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isDisabled={!ready}
              aria-describedby={ready ? undefined : "export-requirement"}
              data-testid={tid(ids, "export_contact_list")}
            >
              Export
            </Button>
          </ButtonGroup>
        </div>
      </Dialog>
    </Modal>
  );
}

// ------------------------------------------------------------------------------ not found

export function NotFound({ testId }: { testId?: string }) {
  return (
    <div data-testid={testId} style={stack(tokens.layoutMarginMedium)}>
      <PageHeading>Page Not Found</PageHeading>
      <Paragraph>The page you are looking for does not exist.</Paragraph>
      <Paragraph>
        <Link href="/">Back to home</Link>
      </Paragraph>
    </div>
  );
}
