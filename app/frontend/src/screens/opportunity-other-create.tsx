import { useEffect, useRef, useState } from "react";
import {
  Button,
  ButtonGroup,
  Checkbox,
  Form,
  Heading,
  NumberField,
  Radio,
  RadioGroup,
  Select,
  Text,
  TextArea,
  TextField,
} from "@bcgov/design-system-react-components";
import { useNavigate } from "@tanstack/react-router";
import { CWU_SKILLS, DESCRIPTION_MAX, REMOTE_DESC_MAX, TEASER_MAX, TITLE_MAX } from "@rules/opportunities";
import {
  LIST_MAX,
  OtherProgram,
  SERVICE_AREAS,
  SWU_BUDGET_MAX,
  SWU_PHASE_NAMES,
  SwuPhase,
  WEIGHT_FIELDS,
  weightTotal,
} from "@rules/other-program-drafts";
import { Account, fetchAccounts } from "../api/accounts";
import {
  OtherProgramSubmission,
  PanelEntry,
  PhaseEntry,
  QuestionEntry,
  ResourceEntry,
  createOtherProgramOpportunity,
} from "../api/other-programs";
import { page, panel, row, stack } from "../app/layout";
import { useScreenTitle } from "../app/screen-title";
import { StaffOnly } from "../app/staff-only";
import { TitledAlert } from "../app/titled-alert";
import { PublishDialog } from "./opportunity-cwu-form";

/**
 * Create a Sprint With Us or Team With Us opportunity, at `/opportunities/sprint-with-us/create`
 * and `/opportunities/team-with-us/create` (opportunity-swu-create, opportunity-twu-create), as far
 * as slice 8 builds them (decision records 0035 and 0036).
 *
 * The form draws every section its story draws: what every program shares; Sprint With Us's
 * skills and phases or Team With Us's resources; the team or resource questions; the scoring
 * weights with their running total; and the evaluation panel. Save draft, Submit for review and,
 * for an administrator, Publish after the publish confirmation all send what the form holds; the
 * service keeps it without yet checking it against the program's own rules, which are slice 10's,
 * and fills in a draft's missing dates (R-1.9). Once saved, the person is taken to the
 * opportunity's manage page, which shows its identifier. Anybody but public sector staff is shown
 * the missing page (R-1.7).
 */

interface Words {
  readonly title: string;
  readonly budgetHeading: string;
  readonly budget: string;
  readonly budgetRule: string;
  readonly questionsHeading: string;
  readonly questionsId: string;
  readonly addQuestion: string;
  readonly addQuestionTestId: string;
  readonly weightRule: string;
  readonly programName: string;
}

const WORDS: Readonly<Record<OtherProgram, Words>> = {
  "sprint-with-us": {
    title: "Create a Sprint With Us opportunity",
    budgetHeading: "Budget and skills",
    budget: "Total maximum budget",
    budgetRule: `Between $1 and $${SWU_BUDGET_MAX.toLocaleString("en-CA")}.`,
    questionsHeading: "Team questions",
    questionsId: "form-team-questions",
    addQuestion: "Add a team question",
    addQuestionTestId: "add-team-question-button",
    weightRule: "Enter each weight as a percentage. The four weights must total 100%.",
    programName: "Sprint With Us",
  },
  "team-with-us": {
    title: "Create a Team With Us opportunity",
    budgetHeading: "Budget",
    budget: "Maximum budget",
    budgetRule: "At least $1.",
    questionsHeading: "Resource questions",
    questionsId: "form-resource-questions",
    addQuestion: "Add a resource question",
    addQuestionTestId: "add-resource-question-button",
    weightRule: "Enter each weight as a percentage. The three weights must total 100%.",
    programName: "Team With Us",
  },
};

/** Each weight's label and the id the story gives its field. */
const WEIGHT_WORDS: Readonly<Record<OtherProgram, Readonly<Record<string, { label: string; id: string }>>>> = {
  "sprint-with-us": {
    questions: { label: "Team questions (%)", id: "opp-weight-questions" },
    codeChallenge: { label: "Code challenge (%)", id: "opp-weight-code-challenge" },
    scenario: { label: "Team scenario (%)", id: "opp-weight-team-scenario" },
    price: { label: "Price (%)", id: "opp-weight-price" },
  },
  "team-with-us": {
    questions: { label: "Resource questions (%)", id: "opp-weight-questions" },
    challenge: { label: "Challenge (%)", id: "opp-weight-challenge" },
    price: { label: "Price (%)", id: "opp-weight-price" },
  },
};

const currency = { style: "currency", currency: "CAD", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 } as const;

const group = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const legend = { paddingInline: "var(--layout-padding-small)", font: "var(--typography-bold-body)" } as const;
const fieldRow = { ...row, alignItems: "end" } as const;

const BLANK_PHASE: PhaseEntry = { startDate: "", completionDate: "" };
const BLANK_QUESTION: QuestionEntry = { question: "", guideline: "", score: Number.NaN, minimumScore: Number.NaN, wordLimit: Number.NaN };
const BLANK_RESOURCE: ResourceEntry = { serviceArea: "", targetAllocation: Number.NaN };
const ADDABLE_PHASES: readonly SwuPhase[] = ["INCEPTION", "PROTOTYPE"];
const PHASE_ORDER: readonly SwuPhase[] = ["INCEPTION", "PROTOTYPE", "IMPLEMENTATION"];

export function blankOtherForm(program: OtherProgram, author: Pick<Account, "id">): OtherProgramSubmission {
  return {
    title: "",
    teaser: "",
    remoteOk: false,
    remoteDesc: "",
    location: "",
    budget: Number.NaN,
    description: "",
    proposalDeadline: "",
    assignmentDate: "",
    startDate: "",
    completionDate: "",
    skills: [],
    phases: program === "sprint-with-us" ? { IMPLEMENTATION: BLANK_PHASE } : {},
    questions: [BLANK_QUESTION],
    resources: program === "team-with-us" ? [BLANK_RESOURCE] : [],
    weights: Object.fromEntries(WEIGHT_FIELDS[program].map((field) => [field, Number.NaN])),
    // The author starts on the panel, as its chair and an evaluator.
    panel: [{ user: author.id, evaluator: true, chair: true }],
  };
}

export function OpportunityOtherCreateScreen({ program }: { program: OtherProgram }) {
  const words = WORDS[program];
  useScreenTitle(words.title);
  return <StaffOnly title={words.title}>{(account) => <CreateOther program={program} account={account} />}</StaffOnly>;
}

type Action = "draft" | "submit" | "publish";

/**
 * Who may be named on the panel: active public sector staff and administrators. Only an
 * administrator may list accounts (R-4.21), so anyone else is offered themselves.
 */
function usePanelCandidates(account: Account): readonly { id: string; label: string }[] {
  const { id, name, type } = account;
  const [candidates, setCandidates] = useState([{ id, label: name }]);
  useEffect(() => {
    if (type !== "ADMIN") return;
    let current = true;
    void fetchAccounts().then((answer) => {
      if (!current || answer.kind !== "listed") return;
      const staff = answer.accounts
        .filter((person) => (person.type === "GOV" || person.type === "ADMIN") && person.status === "ACTIVE")
        .map((person) => ({ id: person.id, label: person.name || person.email || person.id }));
      if (staff.some((person) => person.id === id)) setCandidates(staff);
    });
    return () => {
      current = false;
    };
  }, [id, type]);
  return candidates;
}

function CreateOther({ program, account }: { program: OtherProgram; account: Account }) {
  const navigate = useNavigate();
  const words = WORDS[program];
  const sprint = program === "sprint-with-us";
  const administrator = account.type === "ADMIN";
  const [values, setValues] = useState<OtherProgramSubmission>(() => blankOtherForm(program, account));
  const [failure, setFailure] = useState<readonly string[] | null>(null);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const failureRef = useRef<HTMLDivElement>(null);
  const candidates = usePanelCandidates(account);
  const change = <K extends keyof OtherProgramSubmission>(field: K, value: OtherProgramSubmission[K]) =>
    setValues((current) => ({ ...current, [field]: value }));
  const changeAt = <T,>(list: readonly T[], index: number, patch: Partial<T>): T[] =>
    list.map((item, at) => (at === index ? { ...item, ...patch } : item));

  // A refusal takes focus, so it is heard first.
  useEffect(() => {
    if (failure) failureRef.current?.focus();
  }, [failure]);

  async function send(action: Action) {
    if (sending) return;
    setFailure(null);
    setSending(true);
    const answer = await createOtherProgramOpportunity(
      program,
      values,
      action === "draft" ? "DRAFT" : action === "publish" ? "PUBLISHED" : "UNDER_REVIEW",
    );
    setSending(false);
    setConfirming(false);
    if (answer.kind === "saved") {
      const params = { opportunityId: answer.opportunity.id };
      void (sprint
        ? navigate({ to: "/opportunities/sprint-with-us/$opportunityId/edit", params })
        : navigate({ to: "/opportunities/team-with-us/$opportunityId/edit", params }));
      return;
    }
    setFailure(answer.kind === "refused" ? answer.reasons : []);
  }

  const dayField = (
    field: "proposalDeadline" | "assignmentDate" | "startDate" | "completionDate",
    id: string,
    label: string,
    description: string,
    testId: string,
    isRequired = true,
  ) => (
    <TextField
      id={id}
      type="date"
      label={label}
      isRequired={isRequired}
      description={description}
      value={values[field]}
      onChange={(value) => change(field, value)}
      data-testid={testId}
    />
  );

  const setPhase = (phase: SwuPhase, entry: PhaseEntry | null) =>
    setValues((current) => {
      const phases = { ...current.phases };
      if (entry) phases[phase] = entry;
      else delete phases[phase];
      return { ...current, phases };
    });

  const total = weightTotal(program, values.weights);
  const weightsEntered = WEIGHT_FIELDS[program].some((field) => !Number.isNaN(values.weights[field] ?? Number.NaN));

  return (
    <div style={page}>
      <Heading level={1}>{words.title}</Heading>
      <Text elementType="p">
        {`Required fields are needed to submit for review or publish. A draft can be saved with any of them blank. In this version of the service, what you enter is kept as it is and not yet checked against the ${words.programName} rules.`}
      </Text>
      {failure ? (
        <div tabIndex={-1} ref={failureRef}>
          <TitledAlert variant="danger" role="alert" title="The opportunity was not saved">
            {failure.length > 0 ? (
              <ul>
                {failure.map((reason) => (
                  <li key={reason} data-testid="field-error">
                    {reason}
                  </li>
                ))}
              </ul>
            ) : (
              <Text elementType="p">The service could not save it. Nothing you entered has been lost. Try again.</Text>
            )}
          </TitledAlert>
        </div>
      ) : null}
      <Form
        validationBehavior="aria"
        style={stack}
        onSubmit={(event) => {
          event.preventDefault();
          if (administrator) setConfirming(true);
          else void send("submit");
        }}
      >
        <section aria-labelledby="form-overview" style={panel}>
          <Heading level={2} id="form-overview">
            Overview
          </Heading>
          <TextField
            id="opp-title"
            label="Title"
            isRequired
            description={`Up to ${TITLE_MAX} characters.`}
            value={values.title}
            onChange={(value) => change("title", value)}
            data-testid="opportunity-title-field"
          />
          <TextArea
            id="opp-teaser"
            label="Teaser (optional)"
            description={`A sentence or two shown in the opportunity list. Up to ${TEASER_MAX} characters.`}
            value={values.teaser}
            onChange={(value) => change("teaser", value)}
            data-testid="opportunity-teaser-field"
          />
          <TextField
            id="opp-location"
            label="Location"
            isRequired
            value={values.location}
            onChange={(value) => change("location", value)}
            data-testid="opportunity-location-field"
          />
          <RadioGroup
            id="opp-remote"
            label="Is remote work acceptable?"
            isRequired
            value={values.remoteOk ? "yes" : "no"}
            onChange={(value) => change("remoteOk", value === "yes")}
            data-testid="opportunity-remote-field"
          >
            <Radio value="yes">Yes</Radio>
            <Radio value="no">No</Radio>
          </RadioGroup>
          <TextArea
            id="opp-remote-description"
            label="Remote work description"
            isRequired={values.remoteOk}
            description={`Say what remote work involves. Required when remote work is acceptable. Up to ${REMOTE_DESC_MAX} characters.`}
            value={values.remoteDesc}
            onChange={(value) => change("remoteDesc", value)}
            data-testid="opportunity-remote-description-field"
          />
        </section>
        <section aria-labelledby="form-budget" style={panel}>
          <Heading level={2} id="form-budget">
            {words.budgetHeading}
          </Heading>
          <NumberField
            id="opp-budget"
            label={words.budget}
            isRequired
            description={words.budgetRule}
            formatOptions={currency}
            value={values.budget}
            onChange={(value) => change("budget", value)}
            data-testid="opportunity-budget-field"
          />
          {sprint ? (
            <Select
              id="opp-skills"
              label="Skills"
              selectionMode="multiple"
              isRequired
              description="Choose at least one skill."
              items={CWU_SKILLS.map((skill) => ({ id: skill, label: skill }))}
              value={values.skills}
              onChange={(keys) => change("skills", (keys as readonly (string | number)[]).map(String))}
              data-testid="opportunity-skills-field"
            />
          ) : null}
        </section>
        <section aria-labelledby="form-description" style={panel}>
          <Heading level={2} id="form-description">
            Description
          </Heading>
          <TextArea
            id="opp-description"
            label="Description"
            isRequired
            description={`Formatted text, up to ${DESCRIPTION_MAX.toLocaleString("en-CA")} characters.`}
            value={values.description}
            onChange={(value) => change("description", value)}
            data-testid="opportunity-description-field"
          />
        </section>
        <section aria-labelledby="form-dates" style={panel}>
          <Heading level={2} id="form-dates">
            Key dates
          </Heading>
          <Text elementType="p">Each date must fall on or after the one before it.</Text>
          {dayField(
            "proposalDeadline",
            "opp-deadline",
            "Proposal deadline",
            "Proposals close at 4:00 p.m. Pacific time on this day. It cannot be before today.",
            "opportunity-deadline-field",
          )}
          {dayField("assignmentDate", "opp-assignment", "Assignment date", "On or after the proposal deadline.", "opportunity-assignment-date-field")}
          {sprint ? null : (
            <>
              {dayField("startDate", "opp-start", "Start date", "On or after the assignment date.", "opportunity-start-date-field")}
              {dayField(
                "completionDate",
                "opp-completion",
                "Completion date (optional)",
                "On or after the start date.",
                "opportunity-completion-date-field",
                false,
              )}
            </>
          )}
        </section>
        {sprint ? (
          <section aria-labelledby="form-phases" style={panel}>
            <Heading level={2} id="form-phases">
              Phases
            </Heading>
            <Text elementType="p">
              Every Sprint With Us opportunity has an implementation phase. An inception phase can be added only together with a
              prototype phase.
            </Text>
            {PHASE_ORDER.map((phase) => {
              const entry = values.phases[phase];
              if (!entry) return null;
              const name = SWU_PHASE_NAMES[phase];
              const key = phase.toLowerCase();
              return (
                <fieldset key={phase} style={group}>
                  <legend style={legend}>{`${name} phase`}</legend>
                  <TextField
                    id={`opp-${key}-start`}
                    type="date"
                    label="Start date"
                    isRequired
                    value={entry.startDate}
                    onChange={(value) => setPhase(phase, { ...entry, startDate: value })}
                    data-testid="phase-start-date-field"
                  />
                  <TextField
                    id={`opp-${key}-completion`}
                    type="date"
                    label="Completion date"
                    isRequired
                    value={entry.completionDate}
                    onChange={(value) => setPhase(phase, { ...entry, completionDate: value })}
                    data-testid="phase-completion-date-field"
                  />
                  {phase === "IMPLEMENTATION" ? null : (
                    <div>
                      <Button variant="tertiary" size="small" onPress={() => setPhase(phase, null)}>
                        {`Remove the ${name.toLowerCase()} phase`}
                      </Button>
                    </div>
                  )}
                </fieldset>
              );
            })}
            {ADDABLE_PHASES.some((phase) => !values.phases[phase]) ? (
              <div style={row}>
                {ADDABLE_PHASES.filter((phase) => !values.phases[phase]).map((phase) => (
                  <Button key={phase} variant="secondary" onPress={() => setPhase(phase, BLANK_PHASE)} data-testid="add-phase-button">
                    {`Add ${phase === "INCEPTION" ? "an inception" : "a prototype"} phase`}
                  </Button>
                ))}
              </div>
            ) : null}
          </section>
        ) : (
          <section aria-labelledby="form-resources" style={panel}>
            <Heading level={2} id="form-resources">
              Resources
            </Heading>
            <Text elementType="p">Each resource names one service area and how much of a full-time week it needs.</Text>
            {values.resources.map((resource, index) => {
              const number = index + 1;
              return (
                <fieldset key={index} style={group}>
                  <legend style={legend}>{`Resource ${number}`}</legend>
                  <Select
                    id={`opp-resource-${number}-area`}
                    label="Service area"
                    isRequired
                    items={SERVICE_AREAS.map((area) => ({ id: area.key, label: area.name }))}
                    value={resource.serviceArea === "" ? null : resource.serviceArea}
                    onChange={(key) => change("resources", changeAt(values.resources, index, { serviceArea: key === null ? "" : String(key) }))}
                    data-testid="resource-service-area-field"
                  />
                  <NumberField
                    id={`opp-resource-${number}-allocation`}
                    label="Target allocation (% of full time)"
                    isRequired
                    description="Between 1 and 100."
                    value={resource.targetAllocation}
                    onChange={(value) => change("resources", changeAt(values.resources, index, { targetAllocation: value }))}
                    data-testid="resource-allocation-field"
                  />
                  <div>
                    <Button
                      variant="tertiary"
                      size="small"
                      onPress={() => change("resources", values.resources.filter((_, at) => at !== index))}
                    >
                      {`Remove resource ${number}`}
                    </Button>
                  </div>
                </fieldset>
              );
            })}
            <div>
              <Button
                variant="secondary"
                isDisabled={values.resources.length >= LIST_MAX}
                onPress={() => change("resources", [...values.resources, BLANK_RESOURCE])}
                data-testid="add-resource-button"
              >
                Add a resource
              </Button>
            </div>
          </section>
        )}
        <section aria-labelledby={words.questionsId} style={panel}>
          <Heading level={2} id={words.questionsId}>
            {words.questionsHeading}
          </Heading>
          <Text elementType="p">{`Questions are numbered in the order they appear here. You can add up to ${LIST_MAX}.`}</Text>
          {values.questions.map((question, index) => {
            const number = index + 1;
            const set = (patch: Partial<QuestionEntry>) => change("questions", changeAt(values.questions, index, patch));
            return (
              <fieldset key={index} style={group}>
                <legend style={legend}>{`Question ${number}`}</legend>
                <TextArea
                  id={`opp-question-${number}`}
                  label="Question"
                  isRequired
                  description="Up to 1,000 characters."
                  value={question.question}
                  onChange={(value) => set({ question: value })}
                  data-testid="question-text-field"
                />
                <TextArea
                  id={`opp-question-${number}-guideline`}
                  label="Guideline for evaluators"
                  isRequired
                  description="What a strong answer covers. Up to 1,000 characters."
                  value={question.guideline}
                  onChange={(value) => set({ guideline: value })}
                  data-testid="question-guideline-field"
                />
                <NumberField
                  id={`opp-question-${number}-score`}
                  label="Maximum score"
                  isRequired
                  description="At least 1."
                  value={question.score}
                  onChange={(value) => set({ score: value })}
                  data-testid="question-score-field"
                />
                <NumberField
                  id={`opp-question-${number}-minimum`}
                  label="Minimum score (optional)"
                  description="Lower than the maximum score."
                  value={question.minimumScore}
                  onChange={(value) => set({ minimumScore: value })}
                  data-testid="question-minimum-score-field"
                />
                <NumberField
                  id={`opp-question-${number}-word-limit`}
                  label="Response word limit"
                  isRequired
                  description="Between 1 and 3,000 words."
                  value={question.wordLimit}
                  onChange={(value) => set({ wordLimit: value })}
                  data-testid="question-word-limit-field"
                />
                <div>
                  <Button
                    variant="tertiary"
                    size="small"
                    onPress={() => change("questions", values.questions.filter((_, at) => at !== index))}
                  >
                    {`Remove question ${number}`}
                  </Button>
                </div>
              </fieldset>
            );
          })}
          <div>
            <Button
              variant="secondary"
              isDisabled={values.questions.length >= LIST_MAX}
              onPress={() => change("questions", [...values.questions, BLANK_QUESTION])}
              data-testid={words.addQuestionTestId}
            >
              {words.addQuestion}
            </Button>
          </div>
        </section>
        <section aria-labelledby="form-weights" style={panel}>
          <Heading level={2} id="form-weights">
            Scoring weights
          </Heading>
          <Text elementType="p">{words.weightRule}</Text>
          <div style={fieldRow}>
            {WEIGHT_FIELDS[program].map((field) => {
              const weight = WEIGHT_WORDS[program][field] as { label: string; id: string };
              return (
                <NumberField
                  key={field}
                  id={weight.id}
                  label={weight.label}
                  isRequired
                  description="0 to 100."
                  value={values.weights[field] ?? Number.NaN}
                  onChange={(value) => change("weights", { ...values.weights, [field]: value })}
                  data-testid="score-weight-field"
                />
              );
            })}
          </div>
          <div role="status">
            <Text elementType="p">{`Total: ${total}%`}</Text>
          </div>
          {weightsEntered && total !== 100 ? (
            <Text elementType="p" color="danger" id="opp-weights-error" data-testid="score-weight-error">
              The scoring weights must total 100%.
            </Text>
          ) : null}
        </section>
        <section aria-labelledby="form-panel" style={panel}>
          <Heading level={2} id="form-panel">
            Evaluation panel
          </Heading>
          <div style={stack} data-testid="evaluation-panel-editor">
            <Text elementType="p">
              Name at least two public sector employees and mark exactly one of them as chair. The panel can be changed until the
              consensus stage begins.
            </Text>
            {values.panel.map((member, index) => {
              const number = index + 1;
              const set = (patch: Partial<PanelEntry>) => change("panel", changeAt(values.panel, index, patch));
              return (
                <fieldset key={index} style={group}>
                  <legend style={legend}>{`Panel member ${number}`}</legend>
                  <Select
                    id={`opp-panel-${number}-member`}
                    label="Public sector employee"
                    isRequired
                    items={[...candidates]}
                    value={member.user === "" ? null : member.user}
                    onChange={(key) => set({ user: key === null ? "" : String(key) })}
                  />
                  <Checkbox isSelected={member.evaluator} onChange={(evaluator) => set({ evaluator })}>
                    Evaluator
                  </Checkbox>
                  <Checkbox isSelected={member.chair} onChange={(chair) => set({ chair })}>
                    Chair
                  </Checkbox>
                  {index > 0 ? (
                    <div>
                      <Button
                        variant="tertiary"
                        size="small"
                        onPress={() => change("panel", values.panel.filter((_, at) => at !== index))}
                      >
                        {`Remove panel member ${number}`}
                      </Button>
                    </div>
                  ) : null}
                </fieldset>
              );
            })}
            <div>
              <Button
                variant="secondary"
                isDisabled={values.panel.length >= LIST_MAX}
                onPress={() => change("panel", [...values.panel, { user: "", evaluator: true, chair: false }])}
              >
                Add a panel member
              </Button>
            </div>
          </div>
        </section>
        <section aria-labelledby="form-attachments" style={panel}>
          <Heading level={2} id="form-attachments">
            Attachments
          </Heading>
          <Text elementType="p">
            {`Files cannot be attached to a ${words.programName} opportunity in this version of the service. Code With Us opportunities take attachments.`}
          </Text>
          <div>
            <Button variant="secondary" isDisabled data-testid="attachment-add-button">
              Add attachment
            </Button>
          </div>
        </section>
        <Text elementType="p">
          {administrator
            ? "You will be asked to confirm before anything is published."
            : "An administrator publishes the opportunity after reviewing it."}
        </Text>
        <ButtonGroup ariaLabel="Opportunity actions">
          <Button variant="secondary" isDisabled={sending} onPress={() => void send("draft")} data-testid="opportunity-save-draft">
            Save draft
          </Button>
          {administrator ? (
            <Button variant="primary" isDisabled={sending} onPress={() => setConfirming(true)} data-testid="opportunity-publish">
              Publish
            </Button>
          ) : (
            <Button type="submit" variant="primary" isDisabled={sending} data-testid="opportunity-submit-for-review">
              Submit for review
            </Button>
          )}
        </ButtonGroup>
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
