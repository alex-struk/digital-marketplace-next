import { FormEvent, ReactNode, useRef, useState } from "react";
import {
  Button,
  ButtonGroup,
  Form,
  Heading,
  InlineAlert,
  Link,
  Text,
  TextField,
} from "@bcgov/design-system-react-components";
import {
  OrganizationProfile,
  PROFILE_FIELDS,
  PROFILE_FIELD_ORDER,
  ProfileField,
  profileFieldError,
  validateOrganizationProfile,
} from "@rules/organizations";
import { uploadPicture } from "../api/files";
import { Organization, SaveAnswer } from "../api/organizations";
import { ImagePicker, PictureRejection, checkChosenPicture, keptSentence } from "../app/image-picker";
import { Stack } from "../app/page-layout";
import { TitledAlert } from "../app/titled-alert";

/**
 * The organization's profile form: registering one (organization-create) and the Organization
 * tab in edit mode (organization-edit, editing, invalid, logo-refused). They are the same form,
 * held to the same rule as the service (R-3.22), with the logo picker of the files domain
 * (R-8.13, R-8.21, R-8.28, R-8.30).
 *
 * A field is checked when the person leaves it, and once a later field has been touched, so a
 * required field skipped over is reported too; never on each keystroke. The submit button stays
 * available: submitting with a problem reports every offending field, moves focus to that list,
 * and creates or saves nothing (R-3.22; decision record 0049).
 */

export type ProfileValues = Record<ProfileField, string>;

export const EMPTY_PROFILE: ProfileValues = Object.fromEntries(PROFILE_FIELD_ORDER.map((field) => [field, ""])) as ProfileValues;

export function valuesOf(organization: Organization): ProfileValues {
  return Object.fromEntries(PROFILE_FIELD_ORDER.map((field) => [field, organization[field] ?? ""])) as ProfileValues;
}

const IDS: Record<ProfileField, string> = {
  legalName: "org-legal-name",
  websiteUrl: "org-website",
  streetAddress1: "org-street",
  streetAddress2: "org-street-2",
  city: "org-city",
  region: "org-region",
  mailCode: "org-mail-code",
  country: "org-country",
  contactName: "org-contact-name",
  contactTitle: "org-contact-title",
  contactEmail: "org-contact-email",
  contactPhone: "org-contact-phone",
};

export const FIELD_TEST_IDS: Record<ProfileField, string> = {
  legalName: "organization-legal-name-field",
  websiteUrl: "organization-website-field",
  streetAddress1: "organization-street-address-field",
  streetAddress2: "organization-address-line-2-field",
  city: "organization-city-field",
  region: "organization-region-field",
  mailCode: "organization-mail-code-field",
  country: "organization-country-field",
  contactName: "organization-contact-name-field",
  contactTitle: "organization-contact-title-field",
  contactEmail: "organization-contact-email-field",
  contactPhone: "organization-contact-phone-field",
};

const TYPES: Partial<Record<ProfileField, "url" | "email" | "tel">> = {
  websiteUrl: "url",
  contactEmail: "email",
  contactPhone: "tel",
};

/** The fields whose problems are shown: the ones left, and the ones skipped over before them. */
export function shownProblems(values: ProfileValues, touched: ReadonlySet<ProfileField>): Partial<Record<ProfileField, string>> {
  const lastTouched = Math.max(-1, ...PROFILE_FIELD_ORDER.map((field, index) => (touched.has(field) ? index : -1)));
  const shown: Partial<Record<ProfileField, string>> = {};
  PROFILE_FIELD_ORDER.forEach((field, index) => {
    if (!touched.has(field) && index > lastTouched) return;
    const error = profileFieldError(field, values[field]);
    if (error) shown[field] = error;
  });
  return shown;
}

export function OrganizationForm({
  kind,
  initial,
  storedLogo,
  ownerName,
  save,
  onSaved,
  onCancel,
}: {
  kind: "create" | "edit";
  initial: ProfileValues;
  storedLogo: string | null;
  ownerName: string;
  save: (profile: OrganizationProfile, logoImageFile: string | undefined) => Promise<SaveAnswer>;
  onSaved: (organization: Organization) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<ProfileValues>(initial);
  const [touched, setTouched] = useState<ReadonlySet<ProfileField>>(new Set());
  const [chosen, setChosen] = useState<File | null>(null);
  const [rejection, setRejection] = useState<PictureRejection | null>(null);
  const [rejectionFocus, setRejectionFocus] = useState(0);
  const [saving, setSaving] = useState(false);
  const [refusal, setRefusal] = useState<readonly string[] | null>(null);
  const summary = useRef<HTMLDivElement>(null);
  const choosing = useRef<{ turn: number; check: Promise<{ file: File | null; refused: PictureRejection | null }> | null }>({
    turn: 0,
    check: null,
  });

  const problems = shownProblems(values, touched);
  const problemFields = PROFILE_FIELD_ORDER.filter((field) => problems[field]);
  const valid = validateOrganizationProfile(values).ok;
  const goal = kind === "create" ? "to create the organization" : "to save your changes";
  const hintId = kind === "create" ? "org-submit-hint" : "org-save-hint";

  function change(field: ProfileField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function leave(field: ProfileField) {
    setTouched((current) => (current.has(field) ? current : new Set([...current, field])));
  }

  function choose(file: File) {
    // Only the latest choice counts: one still being read when another is made is set aside.
    const turn = ++choosing.current.turn;
    choosing.current.check = checkChosenPicture(file, "logo").then((refused) => {
      const settled = { file: refused ? null : file, refused };
      if (turn === choosing.current.turn) {
        choosing.current.check = null;
        setRejection(refused);
        setChosen(settled.file);
      }
      return settled;
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setRefusal(null);
    // A logo that was turned down keeps the form open with the refusal in view; nothing is saved
    // (R-8.21, R-8.30). A choice still being checked is waited for first.
    const pending = choosing.current.check;
    const { file: logo, refused } = pending ? await pending : { file: chosen, refused: rejection };
    if (refused) {
      setRejectionFocus((count) => count + 1);
      return;
    }
    const validation = validateOrganizationProfile(values);
    if (!validation.ok) {
      setTouched(new Set(PROFILE_FIELD_ORDER));
      // The list of problems is drawn on the next render; focus follows it there.
      setTimeout(() => summary.current?.focus(), 0);
      return;
    }
    setSaving(true);
    let logoImageFile: string | undefined;
    if (logo) {
      const stored = await uploadPicture(logo);
      if (stored.kind !== "stored") {
        setSaving(false);
        setChosen(null);
        setRejection({
          name: logo.name,
          reason:
            stored.kind === "refused"
              ? `${stored.reasons.join(" ") || "The service did not accept it."} ${keptSentence("logo")}`
              : `It could not be stored. ${keptSentence("logo")}`,
        });
        return;
      }
      logoImageFile = stored.id;
    }
    const answer = await save(validation.profile, logoImageFile);
    setSaving(false);
    if (answer.kind === "saved") {
      onSaved(answer.organization);
      return;
    }
    setRefusal(answer.reasons);
  }

  function field(name: ProfileField): ReactNode {
    const rule = PROFILE_FIELDS[name];
    const description =
      name === "legalName"
        ? "Up to 100 characters."
        : name === "websiteUrl"
          ? "The full address, like https://example.com"
          : name === "contactPhone" && kind === "edit"
            ? "Clear this field to remove the number."
            : undefined;
    return (
      <TextField
        key={name}
        id={IDS[name]}
        label={rule.required ? rule.label : `${rule.label} (optional)`}
        type={TYPES[name]}
        isRequired={rule.required}
        maxLength={rule.maxLength}
        description={description}
        value={values[name]}
        onChange={(value: string) => change(name, value)}
        onBlur={() => leave(name)}
        isInvalid={Boolean(problems[name])}
        errorMessage={problems[name]}
        data-testid={FIELD_TEST_IDS[name]}
      />
    );
  }

  const logoPicker = (
    <ImagePicker
      subject="logo"
      ownerName={values.legalName || ownerName}
      storedFileId={storedLogo}
      chosen={chosen}
      rejection={rejection}
      rejectionFocus={rejectionFocus}
      onChoose={choose}
    />
  );

  const hint =
    problemFields.length > 0 ? (
      <div id={hintId} ref={summary} tabIndex={-1}>
        <InlineAlert variant="danger">
          <span className="title" id="alert-title">
            {`Fix ${problemFields.length} ${problemFields.length === 1 ? "field" : "fields"} ${goal}`}
          </span>
          <ul>
            {problemFields.map((name) => (
              <li key={name} data-testid="field-error">
                <Link href={`#${IDS[name]}`}>
                  {`${PROFILE_FIELDS[name].label}: ${(problems[name] as string).charAt(0).toLowerCase()}${(problems[name] as string).slice(1)}`}
                </Link>
              </li>
            ))}
          </ul>
        </InlineAlert>
      </div>
    ) : !valid ? (
      <Text id={hintId} elementType="p" size="small" color="secondary">
        {`Fill in every required field ${goal}.`}
      </Text>
    ) : null;

  const refused = refusal ? (
    <TitledAlert
      variant="danger"
      role="alert"
      title={kind === "create" ? "The organization could not be created" : "Your changes could not be saved"}
    >
      {refusal.length > 0 ? (
        <ul>
          {refusal.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : (
        <Text elementType="p">Nothing you entered has been lost. Check the details and try again.</Text>
      )}
    </TitledAlert>
  ) : null;

  const buttons = (
    <ButtonGroup ariaLabel="Organization actions">
      <Button
        type="submit"
        variant="primary"
        isDisabled={saving}
        aria-describedby={!valid ? hintId : undefined}
        data-testid={kind === "create" ? "organization-submit-button" : "organization-save-button"}
      >
        {kind === "create" ? "Create organization" : "Save changes"}
      </Button>
      <Button
        variant="secondary"
        onPress={onCancel}
        data-testid={kind === "create" ? "organization-create-cancel" : "organization-cancel-edit-button"}
      >
        Cancel
      </Button>
    </ButtonGroup>
  );

  if (kind === "create") {
    return (
      <Form validationBehavior="aria" onSubmit={submit}>
        <Stack gap="medium">
          <Card headingId="org-details-heading" heading="Organization details">
            {logoPicker}
            {field("legalName")}
            {field("websiteUrl")}
          </Card>
          <Card headingId="org-address-heading" heading="Address">
            {(["streetAddress1", "streetAddress2", "city", "region", "mailCode", "country"] as const).map(field)}
          </Card>
          <Card headingId="org-contact-heading" heading="Contact">
            {(["contactName", "contactTitle", "contactEmail", "contactPhone"] as const).map(field)}
          </Card>
          {refused}
          {hint}
          {buttons}
        </Stack>
      </Form>
    );
  }

  return (
    <Form validationBehavior="aria" onSubmit={submit}>
      <Stack gap="medium">
        <Heading level={2} id="tab-heading">
          Edit organization
        </Heading>
        <Text elementType="p">Fields not marked “(optional)” are required.</Text>
        {logoPicker}
        {field("legalName")}
        {field("websiteUrl")}
        <Heading level={3}>Address</Heading>
        {(["streetAddress1", "streetAddress2", "city", "region", "mailCode", "country"] as const).map(field)}
        <Heading level={3}>Contact</Heading>
        {(["contactName", "contactTitle", "contactEmail", "contactPhone"] as const).map(field)}
        {refused}
        {hint}
        {buttons}
      </Stack>
    </Form>
  );
}

// A card section's border and inner padding are its own; its contents are laid out by the stack.
const panel = {
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;

function Card({ headingId, heading, children }: { headingId: string; heading: string; children: ReactNode }) {
  return (
    <section aria-labelledby={headingId} style={panel}>
      <Stack gap="medium">
        <Heading level={2} id={headingId}>
          {heading}
        </Heading>
        {children}
      </Stack>
    </section>
  );
}
