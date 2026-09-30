import { FormEvent, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "@tanstack/react-router";
import { FileTrigger } from "react-aria-components";
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
import { needsProfileCompletion, ProfileProblems, validateProfile } from "@rules/users";
import { changeOwnAccount, User } from "../api/users";
import { page, stack } from "../app/layout";
import { LoadingStatus } from "../app/loading-status";
import { useScreenTitle } from "../app/screen-title";
import { RequireSignIn } from "../auth/require-sign-in";
import { useSession } from "../auth/session";

const TITLE = "Complete Your Profile";

/**
 * `/sign-up/complete` — finishing signing up (R-4.3, R-4.23, R-4.24, R-4.27, R-4.28).
 *
 * Offered only to a vendor who has never agreed to the terms. A visitor who is not signed in
 * is sent to sign in, and anybody else signed in is moved straight on to their dashboard
 * without being asked anything (R-4.23).
 */
export function SignUpCompleteScreen({ returnTo }: { readonly returnTo: string | null }) {
  useScreenTitle(TITLE);
  return (
    <RequireSignIn title={TITLE}>
      {(user) => <CompleteOrMoveOn user={user} returnTo={returnTo} />}
    </RequireSignIn>
  );
}

function CompleteOrMoveOn({ user, returnTo }: { readonly user: User; readonly returnTo: string | null }) {
  const router = useRouter();
  const mustComplete = needsProfileCompletion(user);

  useEffect(() => {
    if (!mustComplete) router.history.replace("/dashboard");
  }, [mustComplete, router]);

  if (!mustComplete) {
    return (
      <div style={page}>
        <Heading level={1}>{TITLE}</Heading>
        <LoadingStatus label="Opening your dashboard" text="Opening your dashboard…" />
      </div>
    );
  }
  return <CompleteProfileForm user={user} returnTo={returnTo} />;
}

const FIELD_IDS = { name: "profile-name", email: "profile-email" } as const;
const FIELD_LABELS = { name: "Name", email: "Email address" } as const;

function problemCount(problems: ProfileProblems): number {
  return Object.values(problems).filter(Boolean).length;
}

export function CompleteProfileForm({
  user,
  returnTo,
}: {
  readonly user: User;
  readonly returnTo: string | null;
}) {
  const router = useRouter();
  const { signedIn } = useSession();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email ?? "");
  const [notices, setNotices] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [problems, setProblems] = useState<ProfileProblems>({});
  const [saveFailed, setSaveFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const summary = useRef<HTMLDivElement>(null);
  const failure = useRef<HTMLDivElement>(null);

  const count = problemCount(problems);

  useEffect(() => {
    if (count > 0) summary.current?.focus();
  }, [count, problems]);

  useEffect(() => {
    if (saveFailed) failure.current?.focus();
  }, [saveFailed]);

  async function complete(event: FormEvent) {
    event.preventDefault();
    if (!agreed || saving) return;
    setSaveFailed(false);
    // A vendor is never asked for a job title (R-4.28); whatever the account holds is kept.
    const validation = validateProfile({ name, email, jobTitle: user.jobTitle ?? "" });
    if (!validation.valid) {
      setProblems({ ...validation.problems });
      return;
    }
    setProblems({});
    setSaving(true);
    // The details first, then the notice choice, then the agreement: a vendor has finished
    // signing up only once all three are recorded, and the agreement is what marks it.
    let saved = await changeOwnAccount(user.id, { tag: "updateProfile", value: validation.profile });
    if (saved && notices) {
      saved = await changeOwnAccount(user.id, { tag: "updateNotifications", value: true });
    }
    if (saved) saved = await changeOwnAccount(user.id, { tag: "acceptTerms" });
    setSaving(false);
    if (!saved) {
      // The cause is deliberately not named: a duplicate address is told apart from no other
      // fault (R-4.6).
      setSaveFailed(true);
      return;
    }
    // Every screen knows the vendor has finished before they are taken on, so none sends them
    // back here.
    const finished = saved;
    flushSync(() => signedIn(finished));
    router.history.replace(returnTo ?? "/dashboard");
  }

  return (
    <div style={page}>
      <Heading level={1}>{TITLE}</Heading>
      {count > 0 ? (
        <div tabIndex={-1} ref={summary}>
          {/* The design system's alert shows no title once it has children of its own, so the
              title is given here, where the alert's own labelling looks for it. */}
          <InlineAlert variant="danger" role="alert">
            <span className="title" id="alert-title">
              {`Your profile has ${count} ${count === 1 ? "problem" : "problems"}`}
            </span>
            <ul>
              {(["name", "email"] as const).map((field) =>
                problems[field] ? (
                  <li key={field} data-testid="field-error">
                    <Link href={`#${FIELD_IDS[field]}`}>
                      {`${FIELD_LABELS[field]}: ${lowerFirst(problems[field] ?? "")}`}
                    </Link>
                  </li>
                ) : null,
              )}
            </ul>
          </InlineAlert>
        </div>
      ) : null}
      {saveFailed ? (
        <div tabIndex={-1} ref={failure}>
          <InlineAlert
            variant="danger"
            role="alert"
            title="Your profile could not be saved"
            description="Nothing you entered has been lost. Check your details and try again."
          />
        </div>
      ) : null}
      {count === 0 && !saveFailed ? (
        <Text elementType="p">Confirm your details to finish creating your vendor account.</Text>
      ) : null}
      <Form validationBehavior="aria" style={stack} onSubmit={complete}>
        <div style={stack}>
          <Text elementType="p">Profile picture (optional)</Text>
          <Text elementType="p" size="small" color="secondary">
            No profile picture has been added.
          </Text>
          <div>
            <FileTrigger acceptedFileTypes={["image/*"]}>
              <Button variant="secondary" data-testid="change-avatar">
                Choose a profile picture
              </Button>
            </FileTrigger>
          </div>
        </div>
        <TextField
          label="Sign-in username"
          value={user.idpUsername}
          isReadOnly
          description="The account you signed in with. It cannot be changed."
          data-testid="idp-username-field"
        />
        <TextField
          id={FIELD_IDS.name}
          label="Name"
          value={name}
          onChange={setName}
          maxLength={100}
          isRequired
          isInvalid={Boolean(problems.name)}
          errorMessage={problems.name}
          data-testid="name-field"
        />
        <TextField
          id={FIELD_IDS.email}
          label="Email address"
          type="email"
          value={email}
          onChange={setEmail}
          isRequired
          isInvalid={Boolean(problems.email)}
          errorMessage={problems.email}
          data-testid="email-field"
        />
        <Checkbox
          isSelected={notices}
          onChange={setNotices}
          data-testid="sign-up-notifications-checkbox"
        >
          Email me when new opportunities are posted
        </Checkbox>
        <div style={stack}>
          <Text elementType="p">
            Read the{" "}
            <Link href="/content/terms-and-conditions" target="_blank" rel="noopener">
              terms and conditions (opens in a new tab)
            </Link>{" "}
            and the{" "}
            <Link href="/content/privacy" target="_blank" rel="noopener">
              privacy policy (opens in a new tab)
            </Link>{" "}
            before you agree to them.
          </Text>
          <Checkbox
            isRequired
            isSelected={agreed}
            onChange={setAgreed}
            data-testid="sign-up-terms-checkbox"
          >
            I have read and agree to the terms and conditions and the privacy policy
          </Checkbox>
        </div>
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
            {saving ? "Saving…" : "Complete profile"}
          </Button>
        </div>
      </Form>
    </div>
  );
}

function lowerFirst(value: string): string {
  return value.length > 0 ? value.charAt(0).toLowerCase() + value.slice(1) : value;
}
