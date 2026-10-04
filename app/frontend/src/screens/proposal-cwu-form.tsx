import { RefObject, useEffect, useRef, useState } from "react";
import {
  Button,
  ButtonGroup,
  Checkbox,
  Dialog,
  Form,
  Heading,
  Link,
  Modal,
  Radio,
  RadioGroup,
  Select,
  Text,
  TextArea,
  TextField,
} from "@bcgov/design-system-react-components";
import {
  CWU_PROPOSAL_FIELD_LABELS,
  CWU_PROPOSAL_FIELD_ORDER,
  CwuProposalField,
  CwuProposalInput,
  INDIVIDUAL_FIELDS,
  IndividualProponent,
  NOT_ACCEPTING_PROPOSALS,
  ProposalProblem,
  blankIndividual,
  cwuProposalProblems,
  proposalProblemFromLine,
  proposalStatusLabel,
} from "@rules/proposals";
import type { Attachment } from "../api/opportunities";
import type { ActingFor, CwuProposal, CwuProposalSubmission, ProposalSaveAnswer } from "../api/proposals";
import { AttachmentControl, useAttachments } from "../app/attachments";
import { badge, card } from "../app/layout";
import { Stack } from "../app/page-layout";
import { TitledAlert } from "../app/titled-alert";
import { Fact, deadlineLabel, rewardLabel } from "./opportunity-parts";

/**
 * The pieces the Code With Us proposal's create and manage pages share (design/DESIGN.md,
 * proposals): the status badge, the opportunity summary, the form with its error summary and
 * refusals, and the terms dialog every submission passes through.
 */

/** The state in words (`proposal-status`), never colour alone. */
export function ProposalStatusBadge({ status }: { status: string }) {
  return (
    <span style={badge} data-testid="proposal-status">
      {proposalStatusLabel(status)}
    </span>
  );
}

/** The opportunity being proposed on: its title, reward and deadline (`proposal-opportunity-summary`). */
export function OpportunitySummary({
  opportunity,
}: {
  opportunity: { readonly id: string; readonly title: string; readonly reward: number; readonly proposalDeadline: string };
}) {
  return (
    <section aria-labelledby="create-opportunity" style={card} data-testid="proposal-opportunity-summary">
      <Stack gap="medium">
        <Heading level={2} id="create-opportunity">
          The opportunity
        </Heading>
        <Stack as="dl" direction="row" gap="medium">
          <Fact label="Opportunity">
            <Link href={`/opportunities/code-with-us/${opportunity.id}`}>{opportunity.title || "Untitled opportunity"}</Link>
          </Fact>
          <Fact label="Reward">{rewardLabel(opportunity.reward)}</Fact>
          <Fact label="Proposal deadline">{deadlineLabel(opportunity.proposalDeadline)}</Fact>
        </Stack>
      </Stack>
    </section>
  );
}

/** What the form holds while it is being filled in. */
export interface ProposalFormValues {
  /** Who is putting the proposal forward; nobody until the vendor chooses (decision record 0056). */
  readonly proponentType: "individual" | "organization" | null;
  readonly individual: IndividualProponent;
  readonly organization: string;
  readonly proposalText: string;
  readonly additionalComments: string;
}

export function blankValues(): ProposalFormValues {
  return { proponentType: null, individual: blankIndividual(), organization: "", proposalText: "", additionalComments: "" };
}

/** A draft kept with no proponent reads back as an individual with nothing entered: still unchosen. */
function proponentTypeOf(proponent: CwuProposal["proponent"]): ProposalFormValues["proponentType"] {
  if (proponent.tag === "organization") return "organization";
  return Object.values(proponent.value).some((value) => value.trim() !== "") ? "individual" : null;
}

export function valuesFrom(proposal: CwuProposal): ProposalFormValues {
  const { proponent } = proposal;
  return {
    proponentType: proponentTypeOf(proponent),
    individual: proponent.tag === "individual" ? proponent.value : blankIndividual(),
    organization: proponent.tag === "organization" ? proponent.value.id : "",
    proposalText: proposal.proposalText,
    additionalComments: proposal.additionalComments,
  };
}

export function submissionOf(values: ProposalFormValues, attachments: readonly string[]): CwuProposalSubmission {
  return {
    proposalText: values.proposalText,
    additionalComments: values.additionalComments,
    proponent:
      values.proponentType === "organization"
        ? { tag: "organization", value: values.organization }
        : { tag: "individual", value: values.individual },
    attachments,
  };
}

function inputOf(values: ProposalFormValues): CwuProposalInput {
  return { ...submissionOf(values, []) };
}

export const NO_PROPONENT_CHOSEN = "Choose whether an individual or an organization is submitting this proposal";

const PROPONENT_FIELDS: readonly CwuProposalField[] = [...INDIVIDUAL_FIELDS, "organization"];

/**
 * What stops these values being submitted (R-2.13, R-2.14): a proposal carries a complete
 * proponent, so one whose proponent has not been chosen at all is refused for that, alongside
 * whatever is wrong with the rest of it.
 */
export function submissionProblems(values: ProposalFormValues): ProposalProblem[] {
  const problems = cwuProposalProblems(inputOf(values));
  if (values.proponentType !== null) return problems;
  return [
    { field: "proponentType", message: NO_PROPONENT_CHOSEN },
    ...problems.filter((problem) => !PROPONENT_FIELDS.includes(problem.field)),
  ];
}

/** The element each field's error links to (design/DESIGN.md, "Forms and validation"). */
const FIELD_IDS: Readonly<Record<CwuProposalField, string>> = {
  proponentType: "proposal-proponent-type",
  legalName: "proposal-legal-name",
  email: "proposal-email",
  phone: "proposal-phone",
  street1: "proposal-street",
  street2: "proposal-street-2",
  city: "proposal-city",
  region: "proposal-region",
  mailCode: "proposal-postal",
  country: "proposal-country",
  organization: "proposal-organization",
  proposalText: "proposal-text",
  additionalComments: "proposal-comments",
  attachments: "form-attachments",
};

const INDIVIDUAL_INPUTS: readonly {
  readonly field: keyof IndividualProponent;
  readonly label: string;
  readonly testId: string;
  readonly required: boolean;
  readonly type?: "email" | "tel";
}[] = [
  { field: "legalName", label: "Legal name", testId: "proposal-legal-name-field", required: true },
  { field: "email", label: "Email address", testId: "proposal-email-field", required: true, type: "email" },
  { field: "phone", label: "Phone number (optional)", testId: "proposal-phone-field", required: false, type: "tel" },
  { field: "street1", label: "Street address", testId: "proposal-street-field", required: true },
  { field: "street2", label: "Street address line 2 (optional)", testId: "proposal-street-2-field", required: false },
  { field: "city", label: "City", testId: "proposal-city-field", required: true },
  { field: "region", label: "Province or state", testId: "proposal-region-field", required: true },
  { field: "mailCode", label: "Postal code", testId: "proposal-postal-field", required: true },
  { field: "country", label: "Country", testId: "proposal-country-field", required: true },
];

/** "Legal name: enter your legal name"; a sentence the service words itself is kept as it is. */
export function summaryLine(problem: ProposalProblem): string {
  const message = problem.message.endsWith(".") ? problem.message : problem.message.charAt(0).toLowerCase() + problem.message.slice(1);
  return `${CWU_PROPOSAL_FIELD_LABELS[problem.field]}: ${message}`;
}

/** The error summary: every problem, each a link to its field (`field-error`). */
export function ProblemSummary({
  problems,
  title,
  summaryRef,
}: {
  problems: readonly ProposalProblem[];
  title: string;
  summaryRef?: RefObject<HTMLDivElement>;
}) {
  const ordered = [...problems].sort((a, b) => CWU_PROPOSAL_FIELD_ORDER.indexOf(a.field) - CWU_PROPOSAL_FIELD_ORDER.indexOf(b.field));
  return (
    <div tabIndex={-1} ref={summaryRef}>
      <TitledAlert variant="danger" role="alert" title={`${title} ${ordered.length} ${ordered.length === 1 ? "problem" : "problems"}`}>
        <ul>
          {ordered.map((problem) => (
            <li key={problem.field} data-testid="field-error">
              <Link href={`#${FIELD_IDS[problem.field]}`}>{summaryLine(problem)}</Link>
            </li>
          ))}
        </ul>
      </TitledAlert>
    </div>
  );
}

/**
 * The terms dialog (`proposal-terms-dialog`): both the program's terms and the service's, each
 * ticked, before Submit proposal (`proposal-submit-confirm`) does anything (R-2.3).
 */
export function TermsDialog({
  isOpen,
  isSending,
  onCancel,
  onConfirm,
  programName = "Code With Us",
  programTerms = "/content/code-with-us-terms-and-conditions",
}: {
  readonly isOpen: boolean;
  readonly isSending: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  /** The program whose terms are asked for, and the page they are on. */
  readonly programName?: string;
  readonly programTerms?: string;
}) {
  const [program, setProgram] = useState(false);
  const [service, setService] = useState(false);
  useEffect(() => {
    if (!isOpen) {
      setProgram(false);
      setService(false);
    }
  }, [isOpen]);
  return (
    <Modal isOpen={isOpen} isDismissable onOpenChange={(open) => (!open && !isSending ? onCancel() : undefined)}>
      <Dialog isCloseable data-testid="proposal-terms-dialog">
        <div style={{ padding: "var(--layout-padding-large)" }}>
          <Stack gap="medium">
            <Heading level={2} slot="title">
              Submit your proposal
            </Heading>
            <Text elementType="p">
              {`To submit, accept the ${programName} terms and conditions and the Digital Marketplace terms and conditions. Your acceptance is recorded when you submit.`}
            </Text>
            <Text elementType="p">
              Read the <Link href={programTerms}>{`${programName} terms and conditions`}</Link> and the{" "}
              <Link href="/content/terms-and-conditions">Digital Marketplace terms and conditions</Link>.
            </Text>
            <Checkbox isRequired isSelected={program} onChange={setProgram} data-testid="proposal-accept-program-terms">
              {`I accept the ${programName} terms and conditions`}
            </Checkbox>
            <Checkbox isRequired isSelected={service} onChange={setService} data-testid="proposal-accept-app-terms">
              I accept the Digital Marketplace terms and conditions
            </Checkbox>
            <Text id="proposal-terms-hint" elementType="p" size="small" color="secondary">
              Tick both boxes to submit.
            </Text>
            <ButtonGroup ariaLabel="Submit choices">
              <Button variant="secondary" isDisabled={isSending} onPress={onCancel} data-testid="proposal-dialog-cancel">
                Cancel
              </Button>
              <Button
                variant="primary"
                isDisabled={!program || !service || isSending}
                aria-describedby="proposal-terms-hint"
                onPress={onConfirm}
                data-testid="proposal-submit-confirm"
              >
                Submit proposal
              </Button>
            </ButtonGroup>
          </Stack>
        </div>
      </Dialog>
    </Modal>
  );
}

/** What the form asks its page to do: keep it as it is, or put it forward. */
export type ProposalFormAction = "save" | "submit";

/**
 * A refusal the screen could not prevent, said where the story shows it: the deadline having
 * passed, a second proposal (with a way to the first), or anything else the service said.
 */
export interface Refusal {
  readonly title: string;
  readonly reasons: readonly string[];
  readonly existingProposalId?: string;
}

export function CwuProposalForm({
  purpose,
  opportunityId,
  initial,
  initialAttachments = [],
  organizations,
  headingLevel,
  onSend,
  onSaved,
  onCancel,
  refusalTitle,
  accepting = true,
}: {
  readonly purpose: "create" | "edit";
  readonly opportunityId: string;
  readonly initial: ProposalFormValues;
  readonly initialAttachments?: readonly Attachment[];
  /** The organizations the vendor owns or administers, and the one already named if it is not among them. */
  readonly organizations: readonly ActingFor[];
  readonly headingLevel: 2 | 3;
  /** Sends the form; for a submission, once the terms have been accepted in the dialog. */
  readonly onSend: (action: ProposalFormAction, submission: CwuProposalSubmission) => Promise<ProposalSaveAnswer>;
  readonly onSaved: (proposal: CwuProposal, action: ProposalFormAction) => void;
  readonly onCancel: () => void;
  readonly refusalTitle: string;
  /** Whether the opportunity still takes proposals; when it does not, a submission goes unchecked to the service. */
  readonly accepting?: boolean;
}) {
  const [values, setValues] = useState<ProposalFormValues>(initial);
  const [problems, setProblems] = useState<readonly ProposalProblem[]>([]);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const [existingNamed, setExistingNamed] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [sending, setSending] = useState(false);
  const attachments = useAttachments(initialAttachments);
  const summaryRef = useRef<HTMLDivElement>(null);
  const refusalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (problems.length > 0) summaryRef.current?.focus();
  }, [problems]);
  useEffect(() => {
    if (refusal) refusalRef.current?.focus();
  }, [refusal]);

  const H = headingLevel;
  const problemFor = (field: CwuProposalField) => problems.find((problem) => problem.field === field)?.message;
  const invalid = (field: CwuProposalField) => ({ isInvalid: problemFor(field) !== undefined, errorMessage: problemFor(field) });
  const change = (next: Partial<ProposalFormValues>) => setValues((current) => ({ ...current, ...next }));
  const changeIndividual = (field: keyof IndividualProponent, value: string) =>
    setValues((current) => ({ ...current, individual: { ...current.individual, [field]: value } }));

  async function send(action: ProposalFormAction) {
    if (sending) return;
    setRefusal(null);
    setExistingNamed(null);
    setSending(true);
    const stored = await attachments.store();
    if (!stored.ok) {
      setSending(false);
      setAsking(false);
      return;
    }
    const answer = await onSend(action, submissionOf(values, stored.ids));
    setSending(false);
    setAsking(false);
    if (answer.kind === "saved") {
      setProblems([]);
      onSaved(answer.proposal, action);
      return;
    }
    if (answer.kind === "failed") {
      setRefusal({ title: refusalTitle, reasons: ["The service could not save it. Nothing you entered has been lost. Try again."] });
      return;
    }
    const named = answer.reasons.map(proposalProblemFromLine).filter((problem): problem is ProposalProblem => problem !== null);
    setProblems(named);
    if (answer.existingOrganizationProposalId) setExistingNamed(answer.existingOrganizationProposalId);
    const rest = answer.reasons.filter((reason) => proposalProblemFromLine(reason) === null);
    if (rest.length > 0 || named.length === 0) {
      setRefusal({
        title: refusalTitle,
        reasons: rest,
        ...(answer.existingProposalId ? { existingProposalId: answer.existingProposalId } : {}),
      });
    }
  }

  function attempt(action: ProposalFormAction) {
    if (action === "save") {
      setProblems([]);
      void send("save");
      return;
    }
    // Everything a submission needs is checked here first; the terms are asked for only then. Once
    // the opportunity has closed nothing is worth completing: the service's refusal says why (R-2.15).
    const found = accepting ? submissionProblems(values) : [];
    setProblems(found);
    setRefusal(null);
    if (found.length === 0) setAsking(true);
  }

  const shownOrganizations = organizations.length > 0 ? organizations : [];

  return (
    <>
      {problems.length > 0 ? (
        <ProblemSummary
          problems={problems}
          title={purpose === "edit" ? "Your changes have" : "This proposal has"}
          summaryRef={summaryRef}
        />
      ) : null}
      {refusal ? (
        <div tabIndex={-1} ref={refusalRef} data-testid="proposal-refused-message">
          <TitledAlert variant="danger" role="alert" title={refusal.title}>
            {(refusal.reasons.length > 0 ? refusal.reasons : ["The service refused it."]).map((reason) => (
              <Text elementType="p" key={reason}>
                {reason}
              </Text>
            ))}
            {refusal.existingProposalId ? (
              <Link href={`/opportunities/code-with-us/${opportunityId}/proposals/${refusal.existingProposalId}/edit`}>
                Open your proposal
              </Link>
            ) : null}
          </TitledAlert>
        </div>
      ) : null}
      <Form
        validationBehavior="aria"
        onSubmit={(event) => {
          event.preventDefault();
          attempt("submit");
        }}
      >
        <Stack gap="medium">
          <section aria-labelledby="form-proponent" style={card}>
            <Stack gap="medium">
              <Heading level={H} id="form-proponent">
                Proponent
              </Heading>
              <RadioGroup
                id="proposal-proponent-type"
                label="Who is submitting this proposal?"
                isRequired
                value={values.proponentType}
                onChange={(value) => change({ proponentType: value === "organization" ? "organization" : "individual" })}
                {...invalid("proponentType")}
              >
                <Radio value="individual" data-testid="proposal-proponent-individual">
                  An individual
                </Radio>
                <Radio value="organization" data-testid="proposal-proponent-organization">
                  An organization
                </Radio>
              </RadioGroup>
              {values.proponentType === "individual" ? (
                INDIVIDUAL_INPUTS.map((input) => (
                  <TextField
                    key={input.field}
                    id={FIELD_IDS[input.field]}
                    label={input.label}
                    isRequired={input.required}
                    type={input.type}
                    value={values.individual[input.field]}
                    onChange={(value) => changeIndividual(input.field, value)}
                    {...invalid(input.field)}
                    data-testid={input.testId}
                  />
                ))
              ) : values.proponentType === "organization" ? (
                <>
                  <Select
                    id={FIELD_IDS.organization}
                    label="Organization"
                    isRequired
                    description="Organizations you own or administer. An organization can be named on only one proposal for each opportunity."
                    items={shownOrganizations.map((organization) => ({ id: organization.id, label: organization.legalName }))}
                    value={values.organization === "" ? null : values.organization}
                    onChange={(key) => change({ organization: key === null ? "" : String(key) })}
                    {...invalid("organization")}
                    data-testid="proposal-organization-field"
                  />
                  {shownOrganizations.length === 0 ? (
                    <Text elementType="p" size="small">
                      You do not own or administer an organization. <Link href="/organizations/create">Register one</Link>, or
                      propose as an individual.
                    </Text>
                  ) : null}
                  {existingNamed ? (
                    <Text elementType="p" size="small">
                      {`${organizationName(shownOrganizations, values.organization)} already has a proposal for this opportunity. `}
                      <Link href={`/opportunities/code-with-us/${opportunityId}/proposals/${existingNamed}/edit`}>Open the existing proposal</Link>
                    </Text>
                  ) : null}
                </>
              ) : (
                <Text elementType="p" size="small">
                  Choose an individual to enter their legal name, email address and postal address, or an organization you own
                  or administer.
                </Text>
              )}
            </Stack>
          </section>
          <section aria-labelledby="form-proposal" style={card}>
            <Stack gap="medium">
              <Heading level={H} id="form-proposal">
                {purpose === "edit" ? "Proposal text" : "Proposal"}
              </Heading>
              <TextArea
                id={FIELD_IDS.proposalText}
                label="Proposal"
                isRequired
                maxLength={10000}
                description="Between 1 and 10,000 characters."
                value={values.proposalText}
                onChange={(value) => change({ proposalText: value })}
                {...invalid("proposalText")}
                data-testid="proposal-text-field"
              />
              <TextArea
                id={FIELD_IDS.additionalComments}
                label="Additional comments (optional)"
                maxLength={10000}
                description="Up to 10,000 characters."
                value={values.additionalComments}
                onChange={(value) => change({ additionalComments: value })}
                {...invalid("additionalComments")}
                data-testid="proposal-comments-field"
              />
            </Stack>
          </section>
          <AttachmentControl state={attachments} headingLevel={H} host="proposal" saved={purpose === "edit"} />
          {purpose === "create" ? (
            <Text elementType="p">
              You will be asked to accept the terms and conditions when you submit. You can withdraw a submitted proposal at any
              time.
            </Text>
          ) : (
            <Text elementType="p">
              Save changes keeps this proposal as it is. Save changes and submit asks you to accept the terms and conditions.
            </Text>
          )}
          {purpose === "create" ? (
            <ButtonGroup ariaLabel="Proposal actions">
              <Button variant="tertiary" onPress={onCancel} data-testid="proposal-cancel">
                Cancel
              </Button>
              <Button variant="secondary" isDisabled={sending} onPress={() => attempt("save")} data-testid="proposal-save-draft">
                Save draft
              </Button>
              <Button type="submit" variant="primary" isDisabled={sending} data-testid="proposal-submit">
                Submit proposal
              </Button>
            </ButtonGroup>
          ) : (
            <ButtonGroup ariaLabel="Save choices">
              <Button variant="tertiary" onPress={onCancel} data-testid="proposal-cancel-edit">
                Cancel
              </Button>
              <Button variant="secondary" isDisabled={sending} onPress={() => attempt("save")} data-testid="proposal-save-changes">
                Save changes
              </Button>
              <Button type="submit" variant="primary" isDisabled={sending} data-testid="proposal-save-and-submit">
                Save changes and submit
              </Button>
            </ButtonGroup>
          )}
        </Stack>
      </Form>
      <TermsDialog isOpen={asking} isSending={sending} onCancel={() => setAsking(false)} onConfirm={() => void send("submit")} />
    </>
  );
}

function organizationName(organizations: readonly ActingFor[], id: string): string {
  return organizations.find((organization) => organization.id === id)?.legalName ?? "That organization";
}

/** Whether a refusal is the deadline having passed, which the manage page says in its own alert (R-2.15). */
export function isDeadlineRefusal(reasons: readonly string[]): boolean {
  return reasons.includes(NOT_ACCEPTING_PROPOSALS);
}
