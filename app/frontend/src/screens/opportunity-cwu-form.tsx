import { ReactNode, useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  Button,
  ButtonGroup,
  Form,
  Heading,
  Link,
  Modal,
  NumberField,
  Radio,
  RadioGroup,
  Select,
  Text,
  TextArea,
  TextField,
} from "@bcgov/design-system-react-components";
import {
  CWU_FIELD_LABELS,
  CWU_REWARD_MAX,
  CWU_SKILLS,
  CalendarDay,
  CwuField,
  CwuInput,
  CwuProblem,
  DESCRIPTION_MAX,
  REMOTE_DESC_MAX,
  TEASER_MAX,
  TITLE_MAX,
  cwuProblemFromLine,
  cwuProblems,
} from "@rules/opportunities";
import type { Account } from "../api/accounts";
import { CwuOpportunity, CwuSubmission, SaveAnswer } from "../api/opportunities";
import { AttachmentControl, AttachmentList, useAttachments } from "../app/attachments";
import { panel, stack } from "../app/layout";
import { TitledAlert } from "../app/titled-alert";

/**
 * The form a Code With Us opportunity is written in: on the create page, and on the manage page's
 * Opportunity tab in edit mode (design/DESIGN.md, opportunities, "Forms and validation").
 *
 * A draft is never checked: "Save draft" sends whatever the form holds, and the service fills in
 * blank dates (R-1.9). Submitting for review, publishing and saving a change to an opportunity
 * that is not a draft are checked first, by the same rules the service holds them to (R-1.10 to
 * R-1.14), and every problem is named against its field and in a summary that takes focus.
 */

const currency = { style: "currency", currency: "CAD", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 } as const;

export const FIELD_IDS: Readonly<Record<CwuField, string>> = {
  title: "opp-title",
  teaser: "opp-teaser",
  remoteOk: "opp-remote",
  remoteDesc: "opp-remote-description",
  location: "opp-location",
  reward: "opp-reward",
  skills: "opp-skills",
  description: "opp-description",
  proposalDeadline: "opp-deadline",
  assignmentDate: "opp-assignment",
  startDate: "opp-start",
  completionDate: "opp-completion",
  attachments: "form-attachments",
};

const FIELD_ORDER: readonly CwuField[] = [
  "title",
  "teaser",
  "location",
  "remoteOk",
  "remoteDesc",
  "reward",
  "skills",
  "description",
  "proposalDeadline",
  "assignmentDate",
  "startDate",
  "completionDate",
  "attachments",
];

/** What the form holds while it is being filled in. */
export interface CwuFormValues {
  readonly title: string;
  readonly teaser: string;
  /** Whether remote work is acceptable: no, until Yes is chosen. */
  readonly remote: boolean;
  readonly remoteDesc: string;
  readonly location: string;
  /** NaN while nothing is entered, as the number field holds it. */
  readonly reward: number;
  readonly skills: readonly string[];
  readonly description: string;
  readonly proposalDeadline: string;
  readonly assignmentDate: string;
  readonly startDate: string;
  readonly completionDate: string;
}

export const BLANK_FORM: CwuFormValues = {
  title: "",
  teaser: "",
  remote: false,
  remoteDesc: "",
  location: "",
  reward: Number.NaN,
  skills: [],
  description: "",
  proposalDeadline: "",
  assignmentDate: "",
  startDate: "",
  completionDate: "",
};

export function valuesFrom(opportunity: CwuOpportunity): CwuFormValues {
  return {
    title: opportunity.title,
    teaser: opportunity.teaser,
    remote: opportunity.remoteOk === true,
    remoteDesc: opportunity.remoteDesc,
    location: opportunity.location,
    // A draft saved with no reward holds none.
    reward: opportunity.reward > 0 ? opportunity.reward : Number.NaN,
    skills: opportunity.skills,
    description: opportunity.description,
    proposalDeadline: opportunity.proposalDeadline,
    assignmentDate: opportunity.assignmentDate,
    startDate: opportunity.startDate,
    completionDate: opportunity.completionDate ?? "",
  };
}

/** What the form sends, with the attachments it carries. */
export function submissionOf(values: CwuFormValues, attachments: readonly string[]): CwuSubmission {
  return {
    title: values.title,
    teaser: values.teaser,
    remoteOk: values.remote,
    remoteDesc: values.remoteDesc,
    location: values.location,
    reward: Number.isNaN(values.reward) ? null : values.reward,
    skills: values.skills,
    description: values.description,
    proposalDeadline: values.proposalDeadline,
    assignmentDate: values.assignmentDate,
    startDate: values.startDate,
    completionDate: values.completionDate,
    attachments,
  };
}

/** The form's values as the rules read a submission. */
export function inputOf(values: CwuFormValues): CwuInput {
  const submission = submissionOf(values, []);
  const day = (value: string) => (value === "" ? null : value);
  return {
    ...submission,
    proposalDeadline: day(submission.proposalDeadline),
    assignmentDate: day(submission.assignmentDate),
    startDate: day(submission.startDate),
    completionDate: day(submission.completionDate),
    submissionInfo: "",
    acceptanceCriteria: "",
    evaluationCriteria: "",
  };
}

/** The ways a form may be sent. */
export type FormAction = "draft" | "submit" | "publish" | "save";

export interface CwuFormProps {
  readonly purpose: "create" | "edit";
  readonly account: Account;
  readonly initial: CwuFormValues;
  readonly initialAttachments?: CwuOpportunity["attachments"];
  /** Whether what is saved is a draft, which is never checked (R-1.9). */
  readonly isDraft: boolean;
  /** Today in Pacific time, and the earliest proposal deadline the rules accept (R-1.14 note). */
  readonly today: CalendarDay;
  readonly earliestDeadline: CalendarDay;
  readonly headingLevel: 2 | 3;
  /** Said once, after the fields and before the buttons. */
  readonly consequence: ReactNode;
  readonly onSend: (action: FormAction, submission: CwuSubmission) => Promise<SaveAnswer>;
  readonly onSaved: (opportunity: CwuOpportunity) => void;
  readonly onCancel?: () => void;
  /** Shown to someone who may read the opportunity's details but not change them. */
  readonly readOnly?: boolean;
}

export function CwuOpportunityForm({
  purpose,
  account,
  initial,
  initialAttachments = [],
  isDraft,
  today,
  earliestDeadline,
  headingLevel,
  consequence,
  onSend,
  onSaved,
  onCancel,
  readOnly = false,
}: CwuFormProps) {
  const [values, setValues] = useState<CwuFormValues>(initial);
  const [problems, setProblems] = useState<readonly CwuProblem[]>([]);
  const [failure, setFailure] = useState<readonly string[] | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const attachments = useAttachments(initialAttachments);
  const summaryRef = useRef<HTMLDivElement>(null);
  const failureRef = useRef<HTMLDivElement>(null);

  // A refusal or a list of problems takes focus, so it is heard first.
  useEffect(() => {
    if (problems.length > 0) summaryRef.current?.focus();
  }, [problems]);
  useEffect(() => {
    if (failure) failureRef.current?.focus();
  }, [failure]);

  const administrator = account.type === "ADMIN";
  const change = <K extends keyof CwuFormValues>(field: K, value: CwuFormValues[K]) =>
    setValues((current) => ({ ...current, [field]: value }));
  const problemFor = (field: CwuField) => problems.find((problem) => problem.field === field)?.message;
  const invalid = (field: CwuField) => problemFor(field) !== undefined;

  /** The rules' verdict on what is in the form, for anything but a draft. */
  function check(): boolean {
    const found = cwuProblems(inputOf(values), earliestDeadline);
    setProblems(found);
    return found.length === 0;
  }

  async function send(action: FormAction) {
    if (sending) return;
    setFailure(null);
    setSending(true);
    const stored = await attachments.store();
    if (!stored.ok) {
      setSending(false);
      setConfirming(false);
      return;
    }
    const answer = await onSend(action, submissionOf(values, stored.ids));
    setSending(false);
    setConfirming(false);
    if (answer.kind === "saved") {
      setProblems([]);
      onSaved(answer.opportunity);
      return;
    }
    if (answer.kind === "refused") {
      const named = answer.reasons.map(cwuProblemFromLine).filter((problem): problem is CwuProblem => problem !== null);
      if (named.length > 0) setProblems(named);
      const rest = answer.reasons.filter((reason) => cwuProblemFromLine(reason) === null);
      if (rest.length > 0 || named.length === 0) setFailure(rest);
      return;
    }
    setFailure([]);
  }

  function attempt(action: FormAction) {
    if (action === "draft" || (action === "save" && isDraft)) {
      setProblems([]);
      void send(action);
      return;
    }
    if (!check()) return;
    if (action === "publish") setConfirming(true);
    else void send(action);
  }

  const primary: FormAction = purpose === "edit" ? "save" : administrator ? "publish" : "submit";
  const ordered = [...problems].sort((a, b) => FIELD_ORDER.indexOf(a.field) - FIELD_ORDER.indexOf(b.field));
  const H = headingLevel;

  return (
    <div style={stack}>
      {ordered.length > 0 ? (
        <div tabIndex={-1} ref={summaryRef}>
          <TitledAlert
            variant="danger"
            role="alert"
            title={`${purpose === "edit" ? "Your changes have" : "This opportunity has"} ${ordered.length} ${
              ordered.length === 1 ? "problem" : "problems"
            }`}
          >
            <ul>
              {ordered.map((problem) => (
                <li key={problem.field} data-testid="field-error">
                  <Link href={`#${FIELD_IDS[problem.field]}`}>{`${CWU_FIELD_LABELS[problem.field]}: ${lowerFirst(problem.message)}`}</Link>
                </li>
              ))}
            </ul>
          </TitledAlert>
        </div>
      ) : null}
      {failure ? (
        <div tabIndex={-1} ref={failureRef}>
          <TitledAlert variant="danger" role="alert" title="The opportunity was not saved">
            <Text elementType="p">
              {failure.length > 0 ? failure.join(" ") : "The service could not save it. Nothing you entered has been lost. Try again."}
            </Text>
          </TitledAlert>
        </div>
      ) : null}
      <Form
        validationBehavior="aria"
        style={stack}
        onSubmit={(event) => {
          event.preventDefault();
          attempt(primary);
        }}
      >
        <section aria-labelledby="form-overview" style={panel}>
          <Heading level={H} id="form-overview">
            Overview
          </Heading>
          <TextField
            id={FIELD_IDS.title}
            label="Title"
            isRequired
            maxLength={TITLE_MAX}
            description={`Up to ${TITLE_MAX} characters.`}
            value={values.title}
            isReadOnly={readOnly}
            onChange={(value) => change("title", value)}
            isInvalid={invalid("title")}
            errorMessage={problemFor("title")}
            data-testid="opportunity-title-field"
          />
          <TextArea
            id={FIELD_IDS.teaser}
            label="Teaser (optional)"
            maxLength={TEASER_MAX}
            description={`A sentence or two shown in the opportunity list. Up to ${TEASER_MAX} characters.`}
            value={values.teaser}
            isReadOnly={readOnly}
            onChange={(value) => change("teaser", value)}
            isInvalid={invalid("teaser")}
            errorMessage={problemFor("teaser")}
            data-testid="opportunity-teaser-field"
          />
          <TextField
            id={FIELD_IDS.location}
            label="Location"
            isRequired
            value={values.location}
            isReadOnly={readOnly}
            onChange={(value) => change("location", value)}
            isInvalid={invalid("location")}
            errorMessage={problemFor("location")}
            data-testid="opportunity-location-field"
          />
          {/* The stories' Yes / No question. It starts on No, so it is always answered (R-1.11;
              decision record 0031). */}
          <RadioGroup
            id={FIELD_IDS.remoteOk}
            label="Is remote work acceptable?"
            isRequired
            value={values.remote ? "yes" : "no"}
            isReadOnly={readOnly}
            onChange={(value) => change("remote", value === "yes")}
            isInvalid={invalid("remoteOk")}
            errorMessage={problemFor("remoteOk")}
            data-testid="opportunity-remote-field"
          >
            <Radio value="yes">Yes</Radio>
            <Radio value="no">No</Radio>
          </RadioGroup>
          <TextArea
            id={FIELD_IDS.remoteDesc}
            label="Remote work description"
            isRequired={values.remote}
            maxLength={REMOTE_DESC_MAX}
            description={`Say what remote work involves. Required when remote work is acceptable. Up to ${REMOTE_DESC_MAX} characters.`}
            value={values.remoteDesc}
            isReadOnly={readOnly}
            onChange={(value) => change("remoteDesc", value)}
            isInvalid={invalid("remoteDesc")}
            errorMessage={problemFor("remoteDesc")}
            data-testid="opportunity-remote-description-field"
          />
        </section>
        <section aria-labelledby="form-reward" style={panel}>
          <Heading level={H} id="form-reward">
            Reward and skills
          </Heading>
          <NumberField
            id={FIELD_IDS.reward}
            label="Reward"
            isRequired
            description={`Between $1 and $${CWU_REWARD_MAX.toLocaleString("en-CA")}.`}
            formatOptions={currency}
            value={values.reward}
            isReadOnly={readOnly}
            onChange={(value) => change("reward", value)}
            isInvalid={invalid("reward")}
            errorMessage={problemFor("reward")}
            data-testid="opportunity-reward-field"
          />
          <Select
            id={FIELD_IDS.skills}
            label="Skills"
            selectionMode="multiple"
            isRequired
            description="Choose at least one skill."
            items={skillItems(values.skills)}
            value={values.skills}
            isDisabled={readOnly}
            onChange={(keys) => change("skills", (keys as readonly (string | number)[]).map(String))}
            isInvalid={invalid("skills")}
            errorMessage={problemFor("skills")}
            data-testid="opportunity-skills-field"
          />
        </section>
        <section aria-labelledby="form-description" style={panel}>
          <Heading level={H} id="form-description">
            Description
          </Heading>
          <TextArea
            id={FIELD_IDS.description}
            label="Description"
            isRequired
            maxLength={DESCRIPTION_MAX}
            description={`Formatted text, up to ${DESCRIPTION_MAX.toLocaleString("en-CA")} characters.`}
            value={values.description}
            isReadOnly={readOnly}
            onChange={(value) => change("description", value)}
            isInvalid={invalid("description")}
            errorMessage={problemFor("description")}
            data-testid="opportunity-description-field"
          />
        </section>
        <section aria-labelledby="form-dates" style={panel}>
          <Heading level={H} id="form-dates">
            Key dates
          </Heading>
          <Text elementType="p">Each date must fall on or after the one before it.</Text>
          <DayField
            field="proposalDeadline"
            label="Proposal deadline"
            isRequired
            description={
              earliestDeadline < today
                ? "Proposals close at 4:00 p.m. Pacific time on this day. It cannot be before the deadline it already has."
                : "Proposals close at 4:00 p.m. Pacific time on this day. It cannot be before today."
            }
            values={values}
            change={change}
            problemFor={problemFor}
            testId="opportunity-deadline-field"
            readOnly={readOnly}
          />
          <DayField
            field="assignmentDate"
            label="Assignment date"
            isRequired
            description="On or after the proposal deadline."
            values={values}
            change={change}
            problemFor={problemFor}
            testId="opportunity-assignment-date-field"
            readOnly={readOnly}
          />
          <DayField
            field="startDate"
            label="Start date"
            isRequired
            description="On or after the assignment date."
            values={values}
            change={change}
            problemFor={problemFor}
            testId="opportunity-start-date-field"
            readOnly={readOnly}
          />
          <DayField
            field="completionDate"
            label="Completion date (optional)"
            description="On or after the start date."
            values={values}
            change={change}
            problemFor={problemFor}
            testId="opportunity-completion-date-field"
            readOnly={readOnly}
          />
        </section>
        {readOnly ? (
          <section aria-labelledby="form-attachments" style={panel}>
            <Heading level={H} id="form-attachments">
              Attachments
            </Heading>
            {initialAttachments.length > 0 ? (
              <AttachmentList attachments={initialAttachments} heading={false} />
            ) : (
              <Text elementType="p">No attachments have been added.</Text>
            )}
          </section>
        ) : (
          <AttachmentControl state={attachments} headingLevel={H} />
        )}
        {readOnly ? null : consequence}
        {readOnly ? null : (
        <ButtonGroup ariaLabel={purpose === "edit" ? "Form actions" : "Opportunity actions"}>
          {purpose === "create" ? (
            <>
              <Button variant="secondary" isDisabled={sending} onPress={() => attempt("draft")} data-testid="opportunity-save-draft">
                Save draft
              </Button>
              {administrator ? (
                <Button variant="primary" isDisabled={sending} onPress={() => attempt("publish")} data-testid="opportunity-publish">
                  Publish
                </Button>
              ) : (
                <Button type="submit" variant="primary" isDisabled={sending} data-testid="opportunity-submit-for-review">
                  Submit for review
                </Button>
              )}
            </>
          ) : (
            <>
              <Button type="submit" variant="primary" isDisabled={sending} data-testid="opportunity-save-changes">
                Save changes
              </Button>
              <Button variant="secondary" isDisabled={sending} onPress={onCancel} data-testid="opportunity-cancel-edit">
                Cancel
              </Button>
            </>
          )}
        </ButtonGroup>
        )}
      </Form>
      <PublishDialog
        isOpen={confirming}
        isSending={sending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => void send("publish")}
      />
    </div>
  );
}

function lowerFirst(message: string): string {
  return message.charAt(0).toLowerCase() + message.slice(1);
}

/** The skills offered: the service's list, and any the opportunity already names besides. */
function skillItems(chosen: readonly string[]) {
  const all = [...CWU_SKILLS, ...chosen.filter((skill) => !CWU_SKILLS.includes(skill))];
  return all.map((skill) => ({ id: skill, label: skill }));
}

type DayFieldName = "proposalDeadline" | "assignmentDate" | "startDate" | "completionDate";

/**
 * A calendar day. It is the browser's own date input, labelled like every other field, so a day is
 * typed or chosen as one value written YYYY-MM-DD and read back the same way (decision record
 * 0029).
 */
function DayField({
  field,
  label,
  isRequired = false,
  description,
  values,
  change,
  problemFor,
  testId,
  readOnly,
}: {
  readOnly: boolean;
  field: DayFieldName;
  label: string;
  isRequired?: boolean;
  description: string;
  values: CwuFormValues;
  change: (field: DayFieldName, value: string) => void;
  problemFor: (field: CwuField) => string | undefined;
  testId: string;
}) {
  return (
    <TextField
      id={FIELD_IDS[field]}
      type="date"
      label={label}
      isRequired={isRequired}
      description={description}
      value={values[field]}
      isReadOnly={readOnly}
      onChange={(value) => change(field, value)}
      isInvalid={problemFor(field) !== undefined}
      errorMessage={problemFor(field)}
      data-testid={testId}
    />
  );
}

/** Publishing asks first: everyone who asked to hear of new opportunities is emailed (R-1.34). */
export function PublishDialog({
  isOpen,
  isSending,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  isSending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal isOpen={isOpen} isDismissable onOpenChange={(open) => (!open && !isSending ? onCancel() : undefined)}>
      <AlertDialog
        variant="confirmation"
        title="Publish this opportunity?"
        data-testid="opportunity-publish-dialog"
        buttons={
          <>
            <Button variant="secondary" isDisabled={isSending} onPress={onCancel} data-testid="opportunity-dialog-cancel">
              Cancel
            </Button>
            <Button variant="primary" isDisabled={isSending} onPress={onConfirm} data-testid="opportunity-publish-confirm">
              Publish opportunity
            </Button>
          </>
        }
      >
        <Text elementType="p">
          Everyone will be able to read it and send proposals until its proposal deadline. Everyone who has asked to hear about
          new opportunities will be emailed, and its author will be sent a confirmation.
        </Text>
      </AlertDialog>
    </Modal>
  );
}
