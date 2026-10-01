import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertDialog,
  Button,
  ButtonGroup,
  Checkbox,
  Form,
  Heading,
  InlineAlert,
  Link,
  Modal,
  Text,
  TextField,
} from "@bcgov/design-system-react-components";
import {
  CAPABILITIES,
  ProfileErrors,
  ProfileSection,
  asksForJobTitle,
  isPublicSector,
  offersOwnDeactivation,
  offersReactivation,
  profileSectionShown,
  profileSections,
  validateProfile,
} from "@rules/users";
import {
  Account,
  administerAccount,
  changeOwnAccount,
  deactivateAccount,
  deactivateOwnAccount,
  fetchAccount,
} from "../api/accounts";
import { fileAddress, uploadPicture } from "../api/files";
import { ImagePicker, PictureRejection, checkChosenPicture } from "../app/image-picker";
import { page, stack } from "../app/layout";
import { Loading } from "../app/loading";
import { NotFound } from "../app/not-found";
import { RequireSignIn } from "../app/require-sign-in";
import { useScreenTitle } from "../app/screen-title";
import { DEACTIVATED_OWN_ACCOUNT_NOTICE, endAfterOwnDeactivation, holdAccount } from "../auth/session";
import { readDate, readMoment } from "../lib/dates";

/**
 * The profile, at `/users/me` and `/users/:userId` (user-profile, user-profile-self and their
 * sections, notification-unsubscribe-landing).
 *
 * A person sees the sections their kind of account is offered and keeps their own details,
 * picture, capabilities and notice choice here, and may deactivate their own account (R-4.8,
 * R-4.9, R-4.18, R-4.26, R-4.27, R-4.28, R-4.29, R-4.33, R-4.34). An administrator sees
 * somebody else's profile section alone, with the controls that grant or withdraw administrator
 * rights and deactivate or reactivate the account (R-4.12, R-4.19, R-4.30); anyone else is shown
 * the missing page (R-4.25).
 */

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

const STATUS_LABELS: Record<Account["status"], string> = {
  ACTIVE: "Active",
  INACTIVE_USER: "Inactive",
  INACTIVE_ADMIN: "Inactive",
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

const image = { maxWidth: "100%", height: "auto" } as const;

const list = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  listStyle: "none",
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-none)",
} as const;

const capabilityItem = {
  display: "grid",
  gap: "var(--layout-margin-small)",
  padding: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;

/** `/users/me`, and `/users/:userId`. */
export function UserProfileScreen({ userId }: { userId: string }) {
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  return (
    <RequireSignIn title="User Profile" loadingLabel="Loading your profile…">
      {(viewer) =>
        userId === "me" || userId === viewer.id ? (
          <OwnProfile
            account={viewer}
            base={userId === "me" ? "/users/me" : `/users/${viewer.id}`}
            asked={search.tab}
            unsubscribe={search.unsubscribe !== undefined}
          />
        ) : (
          <SomebodyElsesProfile viewer={viewer} userId={userId} />
        )
      }
    </RequireSignIn>
  );
}

// ------------------------------------------------------------------------ somebody else's

/**
 * Somebody else's profile. Only an administrator may read it, and is shown the profile section
 * alone, with no way to change the person's details (R-4.18, R-4.34). Everybody else is shown
 * the missing page, never a refusal, so the page does not say the account exists (R-4.25).
 */
function SomebodyElsesProfile({ viewer, userId }: { viewer: Account; userId: string }) {
  const [answer, setAnswer] = useState<Account | "loading" | "refused">(
    viewer.type === "ADMIN" ? "loading" : "refused",
  );

  useEffect(() => {
    if (viewer.type !== "ADMIN") return;
    let current = true;
    setAnswer("loading");
    void fetchAccount(userId).then((found) => {
      if (current) setAnswer(found.kind === "found" ? found.account : "refused");
    });
    return () => {
      current = false;
    };
  }, [viewer.type, userId]);

  if (answer === "refused") return <NotFound />;
  if (answer === "loading") {
    return (
      <div style={page}>
        <Heading level={1}>User Profile</Heading>
        <Loading label="Loading profile…" />
      </div>
    );
  }
  return <AdministratorsView account={answer} />;
}

function AdministratorsView({ account: read }: { account: Account }) {
  useScreenTitle("User Profile");
  // The account as it now stands, once an administrator's change to it has been saved.
  const [account, setAccount] = useState(read);
  useEffect(() => setAccount(read), [read]);
  return (
    <div style={page}>
      <Heading level={1}>User Profile</Heading>
      <AccountFacts account={account} />
      <section aria-labelledby="details-heading" style={stack}>
        <Heading level={2} id="details-heading">
          Details
        </Heading>
        <StoredPicture account={account} whose="their" />
        <ReadOnlyDetails account={account} />
      </section>
      <AdministratorRights account={account} onSaved={setAccount} />
      <AccountStatusControls account={account} onSaved={setAccount} />
    </div>
  );
}

/** A reason the service gave, as an alert's title, which carries no closing full stop. */
const asTitle = (reason: string | undefined, otherwise: string) => (reason ?? otherwise).replace(/\.$/, "");

/**
 * Granting or withdrawing administrator rights, saved as soon as the box is ticked or unticked
 * (R-4.12). The box shows the change at once and goes back, with the service's reason, if it is
 * refused — as it is for a vendor (user-profile, admin-refused).
 */
function AdministratorRights({ account, onSaved }: { account: Account; onSaved: (account: Account) => void }) {
  const stored = account.type === "ADMIN";
  const [on, setOn] = useState(stored);
  const [saving, setSaving] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  useEffect(() => setOn(stored), [stored]);

  async function save(value: boolean) {
    setOn(value);
    setSaving(true);
    setRefusal(null);
    setStatus(null);
    const answer = await administerAccount(account.id, "updateAdminPermissions", value);
    setSaving(false);
    if (answer.kind !== "saved") {
      setOn(stored);
      setRefusal(asTitle(answer.reasons[0], "The administrator permissions could not be changed"));
      return;
    }
    onSaved(answer.account);
    setStatus(
      answer.account.type === "ADMIN"
        ? `Saved. ${answer.account.name} is now an administrator.`
        : `Saved. ${answer.account.name} is no longer an administrator.`,
    );
  }

  return (
    <section aria-labelledby="permissions-heading" style={stack}>
      <Heading level={2} id="permissions-heading">
        Permissions
      </Heading>
      <Text id="admin-hint" elementType="p" size="small" color="secondary">
        The change takes effect as soon as you tick or untick the box.
      </Text>
      <Checkbox
        isSelected={on}
        isDisabled={saving}
        onChange={(value) => void save(value)}
        aria-describedby={refusal ? "admin-hint admin-refused" : "admin-hint"}
        data-testid="profile-admin-checkbox"
      >
        Administrator
      </Checkbox>
      {refusal ? (
        <div id="admin-refused">
          <InlineAlert variant="danger" role="alert" title={refusal} />
        </div>
      ) : null}
      <div role="status">{status ? <Text elementType="p">{status}</Text> : null}</div>
    </section>
  );
}

/**
 * Deactivating an active account (R-4.30) and reactivating one an administrator deactivated
 * (R-4.19, R-4.20), each asked first. An account its owner deactivated carries no reactivation
 * control, only the statement that its owner comes back by signing in again (R-4.19).
 */
function AccountStatusControls({ account, onSaved }: { account: Account; onSaved: (account: Account) => void }) {
  const [asking, setAsking] = useState(false);
  const [working, setWorking] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const deactivating = account.status === "ACTIVE";
  const deactivated = account.deactivatedOn ? readDate(account.deactivatedOn) : null;
  const onDate = deactivated ? (
    <>
      {" on "}
      <time dateTime={deactivated.dateTime}>{deactivated.label}</time>
    </>
  ) : null;

  async function confirm() {
    if (working) return;
    setWorking(true);
    setRefusal(null);
    setStatus(null);
    const answer = deactivating
      ? await deactivateAccount(account.id)
      : await administerAccount(account.id, "reactivateUser");
    setWorking(false);
    setAsking(false);
    if (answer.kind !== "saved") {
      setRefusal(
        asTitle(
          answer.reasons[0],
          deactivating ? "The account could not be deactivated" : "The account could not be reactivated",
        ),
      );
      return;
    }
    onSaved(answer.account);
    setStatus(
      deactivating
        ? `${answer.account.name}’s account has been deactivated. They have been told by email.`
        : `${answer.account.name}’s account has been reactivated. They have been told by email.`,
    );
  }

  return (
    <section aria-labelledby="status-heading" style={stack}>
      <Heading level={2} id="status-heading">
        Account status
      </Heading>
      {deactivating ? (
        <>
          <Text elementType="p">Deactivating this account removes the person’s access. They will be told by email.</Text>
          <div>
            <Button variant="secondary" danger onPress={() => setAsking(true)} data-testid="profile-deactivate-button">
              Deactivate account
            </Button>
          </div>
        </>
      ) : offersReactivation(account.status) ? (
        <>
          <Text elementType="p">An administrator deactivated this account{onDate}.</Text>
          <Text elementType="p">Reactivating it lets the person sign in again. They will be told by email.</Text>
          <div>
            <Button variant="primary" onPress={() => setAsking(true)} data-testid="profile-reactivate-button">
              Reactivate account
            </Button>
          </div>
        </>
      ) : (
        <InlineAlert
          variant="info"
          title={`This person deactivated their own account${deactivated ? ` on ${deactivated.label}` : ""}`}
          description="An administrator cannot reactivate it. The person reactivates it themselves by signing in again."
        />
      )}
      {refusal ? <InlineAlert variant="danger" role="alert" title={refusal} /> : null}
      <div role="status">{status ? <Text elementType="p">{status}</Text> : null}</div>
      <Modal isOpen={asking} isDismissable onOpenChange={(open) => (working ? undefined : setAsking(open))}>
        <AlertDialog
          variant={deactivating ? "destructive" : "confirmation"}
          title={deactivating ? "Deactivate this account?" : "Reactivate this account?"}
          data-testid="activation-modal"
          buttons={
            <>
              <Button
                variant="secondary"
                isDisabled={working}
                onPress={() => setAsking(false)}
                data-testid="activation-cancel-button"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                danger={deactivating}
                isDisabled={working}
                onPress={() => void confirm()}
                data-testid="activation-confirm-button"
              >
                {deactivating ? "Deactivate account" : "Reactivate account"}
              </Button>
            </>
          }
        >
          <Text elementType="p">
            {deactivating
              ? `${account.name} will no longer be able to sign in. They will be sent an email saying an administrator has removed their access.`
              : `${account.name} will be able to sign in again. They will be sent an email saying an administrator has reactivated their account.`}
          </Text>
        </AlertDialog>
      </Modal>
    </section>
  );
}

// ------------------------------------------------------------------------ one's own

function OwnProfile({
  account,
  base,
  asked,
  unsubscribe,
}: {
  account: Account;
  base: string;
  asked: unknown;
  unsubscribe: boolean;
}) {
  const offered = profileSections(account, account);
  // Arriving from a message's unsubscribe offer opens the notifications section with the
  // question asked, whatever section was named (R-6.6, R-4.29).
  const section = unsubscribe && offered.includes("notifications") ? "notifications" : profileSectionShown(offered, asked);
  return (
    <div style={page}>
      <Heading level={1}>{HEADINGS[section]}</Heading>
      <nav aria-label="Profile sections">
        <ul style={tabs}>
          {offered.map((name) => (
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
      {section === "capabilities" ? (
        <CapabilitiesSection account={account} />
      ) : section === "organizations" ? (
        <OrganizationsSection />
      ) : section === "notifications" ? (
        <NotificationsSection account={account} base={base} askOnArrival={unsubscribe} />
      ) : section === "legal" ? (
        <LegalSection account={account} />
      ) : (
        <ProfileSectionOwn account={account} />
      )}
    </div>
  );
}

/**
 * Whose profile this is, said in words as well as held in the fields below, so the name, job
 * title and address read as they now stand — after a save, or to an administrator (R-4.18).
 */
function AccountFacts({ account }: { account: Account }) {
  const whose = [
    account.name,
    asksForJobTitle(account.type) ? account.jobTitle : null,
    account.email,
  ].filter((part): part is string => Boolean(part));
  return (
    <div style={stack}>
      {whose.length > 0 ? (
        <Text elementType="p">
          <strong>{whose[0]}</strong>
          {whose.length > 1 ? ` · ${whose.slice(1).join(" · ")}` : null}
        </Text>
      ) : null}
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
  );
}

function StoredPicture({ account, whose }: { account: Account; whose: "your" | "their" }) {
  return account.avatarImageFile ? (
    <img
      src={fileAddress(account.avatarImageFile)}
      alt={whose === "your" ? "Your current profile picture" : `Profile picture of ${account.name}`}
      style={image}
      data-testid="profile-image"
    />
  ) : (
    <Text elementType="p" size="small" color="secondary">
      No profile picture has been added.
    </Text>
  );
}

function ReadOnlyDetails({ account }: { account: Account }) {
  return (
    <>
      <TextField
        label="Sign-in username"
        value={account.idpUsername}
        isReadOnly
        description="This cannot be changed."
        data-testid="idp-username-field"
      />
      <TextField label="Name" value={account.name} isReadOnly data-testid="name-field" />
      <TextField label="Email address" value={account.email ?? ""} isReadOnly data-testid="email-field" />
      {asksForJobTitle(account.type) ? (
        <TextField label="Job title" value={account.jobTitle ?? ""} isReadOnly data-testid="job-title-field" />
      ) : null}
    </>
  );
}

function ProfileSectionOwn({ account }: { account: Account }) {
  useScreenTitle("User Profile");
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <>
      <AccountFacts account={account} />
      {editing ? (
        <ProfileForm
          account={account}
          onDone={(didSave) => {
            setEditing(false);
            setSaved(didSave);
          }}
        />
      ) : (
        <section aria-labelledby="details-heading" style={stack}>
          <Heading level={2} id="details-heading">
            Details
          </Heading>
          <StoredPicture account={account} whose="your" />
          <ReadOnlyDetails account={account} />
          <div>
            <Button
              variant="primary"
              onPress={() => {
                setSaved(false);
                setEditing(true);
              }}
              data-testid="profile-edit-button"
            >
              Edit profile
            </Button>
          </div>
        </section>
      )}
      <div role="status">{saved ? <Text elementType="p">Your profile has been saved.</Text> : null}</div>
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
      {offersOwnDeactivation(account.type) ? <DeactivateOwnAccount account={account} /> : null}
    </>
  );
}

type Problem = { readonly field: keyof ProfileErrors; readonly label: string; readonly message: string };

const FIELDS: Record<keyof ProfileErrors, { label: string; id: string }> = {
  name: { label: "Name", id: "profile-name" },
  email: { label: "Email address", id: "profile-email" },
  jobTitle: { label: "Job title", id: "profile-job-title" },
};

/**
 * Editing one's own details and picture (R-4.18, R-4.27, R-4.28). The same rule the service
 * applies is checked first, so the form and the service never disagree; a save the service
 * refuses for any other reason is reported without naming a cause (R-4.6). A chosen picture is
 * stored when the form is saved, and refused where it was chosen (R-8.21, R-8.30). No field caps
 * its own length: a name or job title that is too long is kept as typed and reported, rather
 * than cut short without a word.
 */
function ProfileForm({ account, onDone }: { account: Account; onDone: (saved: boolean) => void }) {
  const asksJobTitle = asksForJobTitle(account.type);
  const [name, setName] = useState(account.name);
  const [email, setEmail] = useState(account.email ?? "");
  const [jobTitle, setJobTitle] = useState(account.jobTitle ?? "");
  const [chosen, setChosen] = useState<File | null>(null);
  const [rejection, setRejection] = useState<PictureRejection | null>(null);
  const [rejectionFocus, setRejectionFocus] = useState(0);
  const choosing = useRef<{
    turn: number;
    check: Promise<{ file: File | null; refused: PictureRejection | null }> | null;
  }>({
    turn: 0,
    check: null,
  });
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [saveFailed, setSaveFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const summary = useRef<HTMLDivElement>(null);

  const problems: Problem[] = (Object.keys(errors) as (keyof ProfileErrors)[])
    .filter((field) => errors[field])
    .map((field) => ({ field, label: FIELDS[field].label, message: errors[field] as string }));

  useEffect(() => {
    if (problems.length > 0) summary.current?.focus();
  }, [problems.length]);

  function choose(file: File) {
    // Only the latest choice counts: one still being read when another is made is set aside.
    const turn = ++choosing.current.turn;
    choosing.current.check = checkChosenPicture(file).then((refused) => {
      const settled = { file: refused ? null : file, refused };
      if (turn === choosing.current.turn) {
        choosing.current.check = null;
        setRejection(refused);
        setChosen(settled.file);
      }
      return settled;
    });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaveFailed(false);
    // A picture that was turned down keeps the form open with the refusal in view: saving
    // would close the form and take the refusal with it, as if the picture had been accepted
    // (R-8.30). A choice still being checked is waited for first.
    const pending = choosing.current.check;
    const { file: picture, refused } = pending ? await pending : { file: chosen, refused: rejection };
    if (refused) {
      setRejectionFocus((count) => count + 1);
      return;
    }
    const validation = validateProfile({ name, email, ...(asksJobTitle ? { jobTitle } : {}) });
    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setSaving(true);

    let avatarImageFile: string | undefined;
    if (picture) {
      const stored = await uploadPicture(picture);
      if (stored.kind === "refused") {
        setSaving(false);
        setRejection({
          name: picture.name,
          reason: `${stored.reasons.join(" ") || "The service did not accept it."} Your current picture has been kept.`,
        });
        setChosen(null);
        return;
      }
      if (stored.kind === "failed") {
        setSaving(false);
        setSaveFailed(true);
        return;
      }
      avatarImageFile = stored.id;
    }

    const answer = await changeOwnAccount(account.id, "updateProfile", {
      ...validation.profile,
      ...(avatarImageFile ? { avatarImageFile } : {}),
    });
    setSaving(false);
    if (answer.kind !== "saved") {
      setSaveFailed(true);
      return;
    }
    holdAccount(answer.account);
    onDone(true);
  }

  return (
    <>
      {saveFailed ? (
        <InlineAlert
          variant="danger"
          role="alert"
          title="Your changes could not be saved"
          description="Nothing you entered has been lost. Check your details and try again."
        />
      ) : null}
      {problems.length > 0 ? (
        <div tabIndex={-1} ref={summary}>
          <InlineAlert variant="danger" role="alert">
            <span className="title" id="alert-title">
              {`Your changes have ${problems.length} ${problems.length === 1 ? "problem" : "problems"}`}
            </span>
            <ul>
              {problems.map((problem) => (
                <li key={problem.field} data-testid="field-error">
                  <Link href={`#${FIELDS[problem.field].id}`}>
                    {`${problem.label}: ${problem.message.charAt(0).toLowerCase()}${problem.message.slice(1)}`}
                  </Link>
                </li>
              ))}
            </ul>
          </InlineAlert>
        </div>
      ) : null}
      <Form validationBehavior="aria" style={stack} onSubmit={save}>
        <Heading level={2}>Edit your details</Heading>
        <ImagePicker
          storedFileId={account.avatarImageFile}
          chosen={chosen}
          rejection={rejection}
          rejectionFocus={rejectionFocus}
          onChoose={choose}
        />
        <TextField
          label="Sign-in username"
          value={account.idpUsername}
          isReadOnly
          description="This cannot be changed."
          data-testid="idp-username-field"
        />
        <TextField
          id="profile-name"
          label="Name"
          value={name}
          onChange={setName}
          isRequired
          isInvalid={Boolean(errors.name)}
          errorMessage={errors.name}
          data-testid="name-field"
        />
        <TextField
          id="profile-email"
          label="Email address"
          type="email"
          value={email}
          onChange={setEmail}
          isRequired
          isInvalid={Boolean(errors.email)}
          errorMessage={errors.email}
          data-testid="email-field"
        />
        {asksJobTitle ? (
          <TextField
            id="profile-job-title"
            label="Job title (optional)"
            value={jobTitle}
            onChange={setJobTitle}
            isInvalid={Boolean(errors.jobTitle)}
            errorMessage={errors.jobTitle}
            data-testid="job-title-field"
          />
        ) : null}
        <ButtonGroup ariaLabel="Profile actions">
          <Button type="submit" variant="primary" isDisabled={saving} data-testid="profile-save-button">
            Save changes
          </Button>
          <Button variant="secondary" onPress={() => onDone(false)} data-testid="profile-cancel-button">
            Cancel
          </Button>
        </ButtonGroup>
      </Form>
    </>
  );
}

/**
 * Deactivating one's own account (R-4.9). It asks first; once confirmed the person is signed
 * out and shown the notice confirming it, and signing in again is how they come back (R-4.5).
 */
function DeactivateOwnAccount({ account }: { account: Account }) {
  const navigate = useNavigate();
  const [asking, setAsking] = useState(false);
  const [working, setWorking] = useState(false);
  const [failed, setFailed] = useState(false);

  async function deactivate() {
    if (working) return;
    setWorking(true);
    setFailed(false);
    const answer = await deactivateOwnAccount(account.id);
    if (answer.kind !== "deactivated") {
      setWorking(false);
      setAsking(false);
      setFailed(true);
      return;
    }
    // The notice first, so that no screen needing a signed-in person is left showing.
    await navigate({ to: DEACTIVATED_OWN_ACCOUNT_NOTICE as never, replace: true });
    await endAfterOwnDeactivation(answer.identityProviderSignedOut);
  }

  return (
    <section aria-labelledby="status-heading" style={stack}>
      <Heading level={2} id="status-heading">
        Deactivate your account
      </Heading>
      <Text elementType="p">You will be signed out at once. You can come back at any time by signing in again.</Text>
      {failed ? (
        <InlineAlert
          variant="danger"
          role="alert"
          title="Your account could not be deactivated"
          description="Nothing has changed. Please try again."
        />
      ) : null}
      <div>
        <Button variant="secondary" danger onPress={() => setAsking(true)} data-testid="profile-deactivate-button">
          Deactivate account
        </Button>
      </div>
      <Modal isOpen={asking} isDismissable onOpenChange={(open) => (working ? undefined : setAsking(open))}>
        <AlertDialog
          variant="destructive"
          title="Deactivate your account?"
          data-testid="activation-modal"
          buttons={
            <>
              <Button
                variant="secondary"
                isDisabled={working}
                onPress={() => setAsking(false)}
                data-testid="activation-cancel-button"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                danger
                isDisabled={working}
                onPress={() => void deactivate()}
                data-testid="activation-confirm-button"
              >
                Deactivate my account
              </Button>
            </>
          }
        >
          <Text elementType="p">
            You will be signed out straight away. Your account will be kept, and you can reactivate it at any time by
            signing in again. We will email you to confirm.
          </Text>
        </AlertDialog>
      </Modal>
    </section>
  );
}

// ------------------------------------------------------------------------ capabilities

/**
 * A vendor's capabilities, each turned on or off as it is ticked and saved at once; leaving
 * them all unticked is allowed (R-4.8).
 */
function CapabilitiesSection({ account }: { account: Account }) {
  useScreenTitle("Capabilities");
  const [held, setHeld] = useState<readonly string[]>(account.capabilities);
  const [expanded, setExpanded] = useState<readonly string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [refused, setRefused] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => setHeld(account.capabilities), [account.capabilities]);

  async function toggle(name: string, on: boolean) {
    if (saving) return;
    const before = held;
    const next = on ? [...held, name] : held.filter((entry) => entry !== name);
    setHeld(next);
    setRefused(null);
    setStatus(null);
    setSaving(true);
    const answer = await changeOwnAccount(account.id, "updateCapabilities", next);
    setSaving(false);
    if (answer.kind === "saved") {
      holdAccount(answer.account);
      setStatus(on ? `Saved. ${name} is recorded as a capability you hold.` : `Saved. ${name} is no longer recorded.`);
    } else {
      setHeld(before);
      setRefused(name);
    }
  }

  return (
    <>
      <Text elementType="p">
        Tick each capability you have. Your choices are saved as you make them, and you may leave them all unticked.
      </Text>
      <ul style={list} aria-label="Capabilities">
        {CAPABILITIES.map((capability, index) => {
          const isExpanded = expanded.includes(capability.name);
          const descriptionId = `capability-${index}-description`;
          return (
            <li key={capability.name} style={capabilityItem} data-testid="capability-row">
              <Checkbox
                isSelected={held.includes(capability.name)}
                onChange={(on) => void toggle(capability.name, on)}
                data-testid="capability-checkbox"
              >
                {capability.name}
              </Checkbox>
              <div>
                <Button
                  variant="tertiary"
                  size="small"
                  aria-expanded={isExpanded}
                  aria-controls={descriptionId}
                  onPress={() =>
                    setExpanded(
                      isExpanded
                        ? expanded.filter((entry) => entry !== capability.name)
                        : [...expanded, capability.name],
                    )
                  }
                  data-testid="capability-description-toggle"
                >
                  {isExpanded ? `Hide description of ${capability.name}` : `Show description of ${capability.name}`}
                </Button>
              </div>
              <div id={descriptionId} hidden={!isExpanded}>
                {isExpanded ? (
                  <Text elementType="p" size="small" color="secondary" data-testid="capability-description">
                    {capability.description}
                  </Text>
                ) : null}
              </div>
              {refused === capability.name ? (
                <InlineAlert
                  variant="danger"
                  role="alert"
                  title="That change could not be saved"
                  description={`${capability.name} is as it was. Please try again.`}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
      <div role="status">{status ? <Text elementType="p">{status}</Text> : null}</div>
    </>
  );
}

// ------------------------------------------------------------------------ organizations

/** Which organizations a person owns or belongs to arrives with organizations (slices 11, 12). */
function OrganizationsSection() {
  useScreenTitle("My Organizations");
  return (
    <Text elementType="p">
      The organizations you own or belong to will be listed here once organizations can be registered on the Digital
      Marketplace.
    </Text>
  );
}

// ------------------------------------------------------------------------ notifications

/**
 * The new-opportunity notice choice (R-4.29). Ticking or unticking the box saves at once, either
 * way, as the person may change it at any time from their profile. Arriving from a message's
 * unsubscribe offer is what asks first, naming the address that would stop receiving them, for
 * whoever is signed in, and nothing changes until they confirm (R-6.6, R-6.7).
 */
function NotificationsSection({
  account,
  base,
  askOnArrival,
}: {
  account: Account;
  base: string;
  askOnArrival: boolean;
}) {
  const [asking, setAsking] = useState(askOnArrival);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useScreenTitle(asking && askOnArrival ? "Unsubscribe" : "Notifications");

  // The box shows the person's choice as soon as it is made — on pressing it, or once the
  // arrival question is confirmed — and goes back only if the service refuses it.
  const stored = account.notificationsOn !== null;
  const [on, setOn] = useState(stored);
  useEffect(() => setOn(stored), [stored]);
  const address = account.email;

  async function save(value: boolean) {
    setOn(value);
    setSaving(true);
    setFailed(false);
    const answer = await changeOwnAccount(account.id, "updateNotifications", value);
    setSaving(false);
    if (answer.kind !== "saved") {
      setOn(stored);
      setFailed(true);
      return false;
    }
    holdAccount(answer.account);
    setStatus(
      value
        ? `Saved. ${address ?? "You"} will be emailed when new opportunities are posted.`
        : `You have unsubscribed. ${address ?? "You"} will no longer be emailed about new opportunities.`,
    );
    return true;
  }

  return (
    <>
      <Text elementType="p" data-testid="notifications-email-address">
        {address
          ? `Notifications are sent to ${address}. If this address is wrong, `
          : "No email address is held for you, so no notifications can be sent. To add one, "}
        <Link href={base}>correct it on your profile</Link>.
      </Text>
      <Text elementType="p">
        This setting covers only emails announcing newly published opportunities. Other emails from the service, such
        as those about opportunities you watch or proposals you have submitted, are not affected by it.
      </Text>
      <Checkbox
        isSelected={on}
        isDisabled={saving}
        onChange={(value) => {
          setStatus(null);
          void save(value);
        }}
        data-testid="notifications-new-opportunities-checkbox"
      >
        Email me when new opportunities are posted
      </Checkbox>
      {failed ? (
        <InlineAlert
          variant="danger"
          role="alert"
          title="Your choice could not be saved"
          description="Nothing has changed. Please try again."
        />
      ) : null}
      <div role="status">{status ? <Text elementType="p">{status}</Text> : null}</div>
      <Modal isOpen={asking} isDismissable onOpenChange={(open) => (saving ? undefined : setAsking(open))}>
        <AlertDialog
          variant="warning"
          title="Stop emails about new opportunities?"
          data-testid="unsubscribe-modal"
          buttons={
            <>
              <Button
                variant="secondary"
                isDisabled={saving}
                onPress={() => setAsking(false)}
                data-testid="unsubscribe-cancel-button"
              >
                Keep receiving them
              </Button>
              <Button
                variant="primary"
                isDisabled={saving}
                onPress={() => {
                  setAsking(false);
                  void save(false);
                }}
                data-testid="unsubscribe-confirm-button"
              >
                Unsubscribe
              </Button>
            </>
          }
        >
          <Text elementType="p">
            {`You are signed in as ${account.name}. `}
            <span data-testid="unsubscribe-confirmation-address">{address ?? "Your account"}</span>
            {" will no longer be emailed when new opportunities are posted."}
          </Text>
          <Text elementType="p">You can turn these emails back on at any time from this page.</Text>
        </AlertDialog>
      </Modal>
    </>
  );
}

// ------------------------------------------------------------------------ legal

/**
 * The privacy policy, the service's terms with when they were agreed to, and the three programs'
 * terms; offered on a vendor's own profile only (R-4.33).
 *
 * Once an administrator has announced changed terms, the vendor's standing acceptance is gone:
 * the section warns them, says when they last agreed, and offers to review and agree to the new
 * terms, which records a fresh acceptance (R-4.16).
 */
function LegalSection({ account: held }: { account: Account }) {
  useScreenTitle("Policies, Terms & Agreements");
  // The account as it now stands, once an agreement has been saved.
  const [account, setAccount] = useState(held);
  useEffect(() => setAccount(held), [held]);
  const [asking, setAsking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [justAgreed, setJustAgreed] = useState(false);
  const agreed = account.acceptedTermsAt ? readMoment(account.acceptedTermsAt) : null;
  const lastAgreed = account.lastAcceptedTermsAt ? readMoment(account.lastAcceptedTermsAt) : null;

  async function agree() {
    setSaving(true);
    setFailed(false);
    const answer = await changeOwnAccount(account.id, "acceptTerms");
    setSaving(false);
    setAsking(false);
    if (answer.kind !== "saved") {
      setFailed(true);
      return;
    }
    setAccount(answer.account);
    setJustAgreed(true);
    holdAccount(answer.account);
  }

  return (
    <>
      <section aria-labelledby="privacy-heading" style={stack} data-testid="legal-privacy-policy">
        <Heading level={2} id="privacy-heading">
          Privacy policy
        </Heading>
        <Text elementType="p">
          The Digital Marketplace collects your name, email address and the details you give in your profile so that
          it can run your account, tell you about opportunities and process the proposals you submit.{" "}
          <Link href="/content/privacy">Read the Digital Marketplace privacy policy</Link>.
        </Text>
        <Text elementType="p">You agreed to this policy when your account was created.</Text>
      </section>
      <section aria-labelledby="terms-heading" style={stack}>
        <Heading level={2} id="terms-heading">
          Terms and conditions
        </Heading>
        {agreed ? null : (
          <div data-testid="legal-terms-updated-warning">
            <InlineAlert
              variant="warning"
              title={lastAgreed ? "The terms and conditions have changed" : "Agree to the terms and conditions"}
              description={
                lastAgreed
                  ? "Review and agree to the updated terms and conditions to continue using the Digital Marketplace."
                  : "Review and agree to the terms and conditions to continue using the Digital Marketplace."
              }
              buttons={
                <Button
                  variant="primary"
                  onPress={() => {
                    setFailed(false);
                    setAsking(true);
                  }}
                  data-testid="legal-accept-updated-terms-button"
                >
                  {lastAgreed ? "Review and agree to the updated terms" : "Review and agree to the terms"}
                </Button>
              }
            />
          </div>
        )}
        {failed ? (
          <InlineAlert
            variant="danger"
            role="alert"
            title="Your agreement could not be saved"
            description="Nothing has changed. Please try again."
          />
        ) : null}
        <div role="status">
          {agreed && justAgreed ? (
            <Text elementType="p">Thank you. Your agreement to the terms and conditions has been recorded.</Text>
          ) : null}
        </div>
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
        <ul style={{ ...stack, margin: "var(--layout-margin-none)" }}>
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
      <Modal isOpen={asking} isDismissable onOpenChange={(open) => (saving ? undefined : setAsking(open))}>
        <AlertDialog
          variant="confirmation"
          title={lastAgreed ? "Agree to the updated terms and conditions?" : "Agree to the terms and conditions?"}
          data-testid="legal-accept-terms-modal"
          buttons={
            <>
              <Button variant="secondary" isDisabled={saving} onPress={() => setAsking(false)}>
                Not now
              </Button>
              <Button
                variant="primary"
                isDisabled={saving}
                onPress={() => void agree()}
                data-testid="legal-accept-terms-confirm-button"
              >
                I agree
              </Button>
            </>
          }
        >
          <Text elementType="p">
            By agreeing, you confirm you have read and agree to the{" "}
            <Link href="/content/terms-and-conditions">Digital Marketplace terms and conditions</Link>. The date and
            time you agree will be recorded on your account.
          </Text>
        </AlertDialog>
      </Modal>
    </>
  );
}
