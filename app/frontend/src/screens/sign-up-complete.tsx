import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Button,
  Checkbox,
  Form,
  Heading,
  InlineAlert,
  Link,
  Text,
  TextField,
} from "@bcgov/design-system-react-components";
import { DASHBOARD } from "@rules/sign-in";
import { needsProfileCompletion, ProfileErrors, validateProfile } from "@rules/users";
import { Account, changeOwnAccount } from "../api/accounts";
import { uploadPicture } from "../api/files";
import { ImagePicker, PictureRejection, checkChosenPicture } from "../app/image-picker";
import { Stack } from "../app/page-layout";
import { Loading } from "../app/loading";
import { useScreenTitle } from "../app/screen-title";
import { holdAccount, useSession } from "../auth/session";
import { useGoTo } from "../app/go-to";

/**
 * Complete Your Profile (user-sign-up-complete). Offered only to a vendor who has never agreed
 * to the terms; a vendor who has, and every public sector employee, go on to their dashboard,
 * and a visitor is sent to sign in (R-4.23).
 */
export function SignUpCompleteScreen() {
  useScreenTitle("Complete Your Profile");
  const session = useSession();
  const goTo = useGoTo();

  const offered = session.status === "signed-in" && needsProfileCompletion(session.account);

  useEffect(() => {
    if (session.status === "visitor") {
      goTo("/sign-in?redirectOnSuccess=%2Fsign-up%2Fcomplete");
    } else if (session.status === "signed-in" && !offered) {
      goTo(DASHBOARD);
    }
  }, [session.status, offered, goTo]);

  if (session.status !== "signed-in" || !offered) {
    return (
      <Stack gap="large">
        <Heading level={1}>Complete Your Profile</Heading>
        <Loading label="Loading…" />
      </Stack>
    );
  }
  return <CompletionForm account={session.account} />;
}

type Problem = { readonly field: keyof ProfileErrors; readonly label: string; readonly message: string };

const FIELD_LABELS: Record<keyof ProfileErrors, { label: string; id: string }> = {
  name: { label: "Name", id: "profile-name" },
  email: { label: "Email address", id: "profile-email" },
  jobTitle: { label: "Job title", id: "profile-job-title" },
};

function CompletionForm({ account }: { account: Account }) {
  const goTo = useGoTo();
  const [name, setName] = useState(account.name);
  const [email, setEmail] = useState(account.email ?? "");
  const [notices, setNotices] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [saveFailed, setSaveFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [chosen, setChosen] = useState<File | null>(null);
  const [rejection, setRejection] = useState<PictureRejection | null>(null);
  const choosing = useRef<{ turn: number; check: Promise<File | null> | null }>({ turn: 0, check: null });

  const problems: Problem[] = (Object.keys(errors) as (keyof ProfileErrors)[])
    .filter((field) => errors[field])
    .map((field) => ({
      field,
      label: FIELD_LABELS[field].label,
      message: errors[field] as string,
    }));

  async function complete(event: FormEvent) {
    event.preventDefault();
    if (!agreed || saving) return;
    setSaveFailed(false);

    // The same rule the service applies, so the form and the service never disagree (R-4.27).
    const validation = validateProfile({ name, email });
    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setSaving(true);

    // A chosen picture is stored first, so the details can name it (file-image-picker).
    // A choice still being checked is waited for, so it is not left out.
    const picture = choosing.current.check ? await choosing.current.check : chosen;
    let avatarImageFile: string | undefined;
    if (picture) {
      const stored = await uploadPicture(picture);
      if (stored.kind !== "stored") {
        setSaving(false);
        if (stored.kind === "refused") {
          setRejection({
            name: picture.name,
            reason: `${stored.reasons.join(" ") || "The service did not accept it."} Choose another picture, or none.`,
          });
          setChosen(null);
        } else {
          setSaveFailed(true);
        }
        return;
      }
      avatarImageFile = stored.id;
    }

    // The details first, so that a refusal — an email address another account holds, among
    // others — leaves the person where they were, with nothing they entered lost (R-4.6).
    // The terms last, because agreeing is what completes the profile (R-4.3).
    const steps: (() => ReturnType<typeof changeOwnAccount>)[] = [
      () =>
        changeOwnAccount(account.id, "updateProfile", {
          ...validation.profile,
          ...(avatarImageFile ? { avatarImageFile } : {}),
        }),
      ...(notices ? [() => changeOwnAccount(account.id, "updateNotifications", true)] : []),
      () => changeOwnAccount(account.id, "acceptTerms"),
    ];
    let latest: Account = account;
    for (const step of steps) {
      const answer = await step();
      if (answer.kind !== "saved") {
        setSaving(false);
        setSaveFailed(true);
        return;
      }
      latest = answer.account;
    }
    holdAccount(latest);
    goTo(DASHBOARD);
  }

  return (
    <Stack gap="large">
      <Heading level={1}>Complete Your Profile</Heading>
      {saveFailed ? (
        <InlineAlert
          variant="danger"
          role="alert"
          title="Your profile could not be saved"
          description="Nothing you entered has been lost. Check your details and try again."
        />
      ) : null}
      {problems.length > 0 ? (
        <div tabIndex={-1}>
          <InlineAlert variant="danger" role="alert">
            {/* The design system's alert shows no title of its own once it has children, and
                names itself by the element with this id, so the title is given here. */}
            <span className="title" id="alert-title">
              {`Your profile has ${problems.length} ${problems.length === 1 ? "problem" : "problems"}`}
            </span>
            <ul>
              {problems.map((problem) => (
                <li key={problem.field} data-testid="field-error">
                  <Link href={`#${FIELD_LABELS[problem.field].id}`}>
                    {`${problem.label}: ${problem.message.charAt(0).toLowerCase()}${problem.message.slice(1)}`}
                  </Link>
                </li>
              ))}
            </ul>
          </InlineAlert>
        </div>
      ) : (
        <Text elementType="p">Confirm your details to finish creating your vendor account.</Text>
      )}
      <Form validationBehavior="aria" onSubmit={complete}>
        <Stack gap="medium">
          <ImagePicker
            storedFileId={account.avatarImageFile}
            chosen={chosen}
            rejection={rejection}
            onChoose={(file) => {
              // Only the latest choice counts: one still being read when another is made is set aside.
              const turn = ++choosing.current.turn;
              choosing.current.check = checkChosenPicture(file).then((refused) => {
                const accepted = refused ? null : file;
                if (turn === choosing.current.turn) {
                  choosing.current.check = null;
                  setRejection(refused);
                  setChosen(accepted);
                }
                return accepted;
              });
            }}
          />
          <TextField
            label="Sign-in username"
            value={account.idpUsername}
            isReadOnly
            description="The account you signed in with. It cannot be changed."
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
          <Checkbox
            isSelected={notices}
            onChange={setNotices}
            data-testid="sign-up-notifications-checkbox"
          >
            Email me when new opportunities are posted
          </Checkbox>
          <Stack gap="small">
            <Text elementType="p">
              Read the <Link href="/content/terms-and-conditions">terms and conditions</Link> and
              the <Link href="/content/privacy">privacy policy</Link> before you agree to them.
            </Text>
            <Checkbox
              isRequired
              isSelected={agreed}
              onChange={setAgreed}
              data-testid="sign-up-terms-checkbox"
            >
              I have read and agree to the terms and conditions and the privacy policy
            </Checkbox>
          </Stack>
          {agreed ? null : (
            <Text id="sign-up-complete-hint" elementType="p" size="small" color="secondary">
              Agree to the terms and conditions and the privacy policy to complete your profile.
            </Text>
          )}
          <div>
            <Button
              type="submit"
              variant="primary"
              isDisabled={!agreed || saving}
              aria-describedby={agreed ? undefined : "sign-up-complete-hint"}
              data-testid="sign-up-complete-button"
            >
              Complete profile
            </Button>
          </div>
        </Stack>
      </Form>
    </Stack>
  );
}
