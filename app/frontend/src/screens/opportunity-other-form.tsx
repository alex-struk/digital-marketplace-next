import { ReactNode, useEffect, useRef, useState } from "react";
import {
  Button,
  ButtonGroup,
  Checkbox,
  Form,
  Heading,
  Link,
  NumberField,
  Radio,
  RadioGroup,
  Select,
  Text,
  TextArea,
  TextField,
} from "@bcgov/design-system-react-components";
import { CWU_SKILLS, CalendarDay, DESCRIPTION_MAX, REMOTE_DESC_MAX, TEASER_MAX, TITLE_MAX } from "@rules/opportunities";
import {
  OtherProblem,
  PROGRAM_TERMS,
  WEIGHT_KEYS,
  otherFieldLabel,
  otherProblemFromLine,
  otherProblems,
  panelProblems,
  readOtherInput,
} from "@rules/other-program-content";
import {
  LIST_MAX,
  OtherProgram,
  QUESTIONS_MAX,
  SERVICE_AREAS,
  SWU_BUDGET_MAX,
  SWU_PHASE_NAMES,
  SwuPhase,
  WEIGHT_FIELDS,
  WeightsDraft,
  weightTotal,
} from "@rules/other-program-drafts";
import type { Account } from "../api/accounts";
import {
  OtherProgramOpportunity,
  OtherProgramSaveAnswer,
  OtherProgramSubmission,
  PanelCandidate,
  PanelEntry,
  PhaseEntry,
  QuestionEntry,
  ResourceEntry,
  contentOf,
} from "../api/other-programs";
import { card } from "../app/layout";
import { Stack } from "../app/page-layout";
import { TitledAlert } from "../app/titled-alert";
import { PublishDialog } from "./opportunity-cwu-form";

/**
 * The Sprint With Us and Team With Us form (opportunity-swu-create, opportunity-twu-create, and the
 * Opportunity tab of their manage pages): what every program shares; Sprint With Us's skills and
 * phases or Team With Us's resources; the team or resource questions, each placed by its order in
 * the list (R-1.17); the scoring weights with their running total (R-1.15); and, on the create page,
 * the evaluation panel. Once the opportunity exists its panel is changed on its own tab.
 *
 * A draft is sent as it stands (R-1.9). Anything else is checked against the program's rules, which
 * the service shares, and each problem is named in the summary and against its field; the service's
 * own refusal is shown the same way (decision record 0045).
 */

export type OtherFormAction = "draft" | "submit" | "publish" | "save";

interface Words {
  readonly budgetHeading: string;
  readonly budget: string;
  readonly budgetRule: string;
  readonly questionsHeading: string;
  readonly questionsId: string;
  readonly addQuestion: string;
  readonly addQuestionTestId: string;
  readonly weightRule: string;
}

const WORDS: Readonly<Record<OtherProgram, Words>> = {
  "sprint-with-us": {
    budgetHeading: "Budget and skills",
    budget: "Total maximum budget",
    budgetRule: `Between $1 and $${SWU_BUDGET_MAX.toLocaleString("en-CA")}.`,
    questionsHeading: "Team questions",
    questionsId: "form-team-questions",
    addQuestion: "Add a team question",
    addQuestionTestId: "add-team-question-button",
    weightRule: "Enter each weight as a percentage. The four weights must total 100%.",
  },
  "team-with-us": {
    budgetHeading: "Budget",
    budget: "Maximum budget",
    budgetRule: "At least $1.",
    questionsHeading: "Resource questions",
    questionsId: "form-resource-questions",
    addQuestion: "Add a resource question",
    addQuestionTestId: "add-resource-question-button",
    weightRule: "Enter each weight as a percentage. The three weights must total 100%.",
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

// A bordered group of fields: the card's border and padding, with the fieldset's own margin removed.
const group = { ...card, margin: "var(--layout-margin-none)" } as const;
const legend = { paddingInline: "var(--layout-padding-small)", font: "var(--typography-bold-body)" } as const;

const BLANK_PHASE: PhaseEntry = { startDate: "", completionDate: "" };
const BLANK_QUESTION: QuestionEntry = { question: "", guideline: "", score: Number.NaN, minimumScore: Number.NaN, wordLimit: Number.NaN };
const BLANK_RESOURCE: ResourceEntry = { serviceArea: "", targetAllocation: Number.NaN };
const BLANK_MEMBER: PanelEntry = { user: "", evaluator: true, chair: false };
const ADDABLE_PHASES: readonly SwuPhase[] = ["INCEPTION", "PROTOTYPE"];
const PHASE_ORDER: readonly SwuPhase[] = ["INCEPTION", "PROTOTYPE", "IMPLEMENTATION"];
const PHASE_KEYS: Readonly<Record<SwuPhase, string>> = {
  INCEPTION: "inceptionPhase",
  PROTOTYPE: "prototypePhase",
  IMPLEMENTATION: "implementationPhase",
};
const QUESTION_PARTS: Readonly<Record<string, string>> = {
  question: "",
  guideline: "-guideline",
  score: "-score",
  minimumScore: "-minimum",
  wordLimit: "-word-limit",
};

/**
 * An empty form. The panel starts as its story draws it: two members still to be chosen, each an
 * evaluator and neither the chair. A draft saved with nobody chosen is given its author alone, by
 * the service (decision record 0045).
 */
export function blankOtherForm(program: OtherProgram): OtherProgramSubmission {
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
    panel: [BLANK_MEMBER, BLANK_MEMBER],
  };
}

/** The element a refused field is shown at, for the summary's link to it. */
export function otherFieldId(program: OtherProgram, field: string): string {
  const fixed: Record<string, string> = {
    title: "opp-title",
    teaser: "opp-teaser",
    location: "opp-location",
    remoteOk: "opp-remote",
    remoteDesc: "opp-remote-description",
    description: "opp-description",
    totalMaxBudget: "opp-budget",
    maxBudget: "opp-budget",
    mandatorySkills: "opp-skills",
    proposalDeadline: "opp-deadline",
    assignmentDate: "opp-assignment",
    startDate: "opp-start",
    completionDate: "opp-completion",
    phases: "opp-phases-error",
    resources: "form-resources",
    scoringWeights: "opp-weights-error",
    evaluationPanel: "form-panel",
    [PROGRAM_TERMS[program].questionsKey]: WORDS[program].questionsId,
  };
  for (const name of WEIGHT_FIELDS[program]) fixed[WEIGHT_KEYS[name]] = WEIGHT_WORDS[program][name]?.id ?? "form-weights";
  if (field in fixed) return fixed[field] as string;
  const [head, second, third] = field.split(".");
  const phase = PHASE_ORDER.find((key) => PHASE_KEYS[key] === head);
  if (phase) return `opp-${phase.toLowerCase()}-${second === "startDate" ? "start" : "completion"}`;
  if (head === PROGRAM_TERMS[program].questionsKey) return `opp-question-${second}${QUESTION_PARTS[third ?? "question"] ?? ""}`;
  if (head === "resources") return `opp-resource-${second}-${third === "serviceArea" ? "area" : "allocation"}`;
  return "form-overview";
}

/**
 * The panel rules on the create form. A row with nobody chosen is not a member — the request leaves
 * it out — so a panel of one chosen person is refused as too small, not for its empty row. The list
 * offers only public sector employees, so each person chosen is one. A problem with one member is
 * numbered by its row on the form.
 */
export function createPanelProblems(panel: readonly PanelEntry[], nameOf: (id: string) => string | null): OtherProblem[] {
  const rows = panel.map((member, index) => ({ member, row: index + 1 })).filter(({ member }) => member.user !== "");
  const problems = panelProblems(
    rows.map(({ member }) => ({
      user: member.user,
      name: nameOf(member.user),
      kind: "GOV" as const,
      active: true,
      evaluator: member.evaluator,
      chair: member.chair,
    })),
  );
  return problems.map((problem) => {
    const place = /^Panel member (\d+): /.exec(problem.message);
    if (!place) return problem;
    const row = rows[Number(place[1]) - 1]?.row ?? Number(place[1]);
    return { ...problem, message: `Panel member ${row}: ${problem.message.slice(place[0].length)}` };
  });
}

const lowerFirst = (words: string) => (words ? words.charAt(0).toLowerCase() + words.slice(1) : words);

interface OtherFormProps {
  readonly program: OtherProgram;
  readonly purpose: "create" | "edit";
  readonly account: Account;
  readonly initial: OtherProgramSubmission;
  /** Whether what is saved is a draft, which is never checked (R-1.9). */
  readonly isDraft: boolean;
  /** The earliest proposal deadline the rules accept: today, or a passed deadline kept (R-1.14 note). */
  readonly earliestDeadline: CalendarDay;
  readonly headingLevel: 2 | 3;
  /** Said once, after the fields and before the buttons. */
  readonly consequence?: ReactNode;
  /** Who may be put on the panel, on the create page. */
  readonly candidates?: readonly PanelCandidate[];
  readonly onSend: (action: OtherFormAction, submission: OtherProgramSubmission) => Promise<OtherProgramSaveAnswer>;
  readonly onSaved: (opportunity: OtherProgramOpportunity) => void;
  readonly onCancel?: () => void;
  /** Shown to someone who may read the opportunity's details but not change them. */
  readonly readOnly?: boolean;
}

export function OtherProgramForm({
  program,
  purpose,
  account,
  initial,
  isDraft,
  earliestDeadline,
  headingLevel,
  consequence,
  candidates = [],
  onSend,
  onSaved,
  onCancel,
  readOnly = false,
}: OtherFormProps) {
  const words = WORDS[program];
  const sprint = program === "sprint-with-us";
  const creating = purpose === "create";
  const administrator = account.type === "ADMIN";
  const [values, setValues] = useState<OtherProgramSubmission>(initial);
  const [problems, setProblems] = useState<readonly OtherProblem[]>([]);
  const [failure, setFailure] = useState<readonly string[] | null>(null);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const H = headingLevel;

  // A refusal or a list of problems takes focus, so it is heard first.
  useEffect(() => {
    if (problems.length > 0) summaryRef.current?.focus();
  }, [problems]);
  useEffect(() => {
    if (failure) failureRef.current?.focus();
  }, [failure]);

  const change = <K extends keyof OtherProgramSubmission>(field: K, value: OtherProgramSubmission[K]) =>
    setValues((current) => ({ ...current, [field]: value }));
  const changeAt = <T,>(items: readonly T[], index: number, patch: Partial<T>): T[] =>
    items.map((item, at) => (at === index ? { ...item, ...patch } : item));
  const problemFor = (field: string) => problems.find((problem) => problem.field === field)?.message;
  const invalid = (field: string) => ({ isInvalid: problemFor(field) !== undefined, errorMessage: problemFor(field) });
  const candidateName = (id: string) => candidates.find((candidate) => candidate.id === id)?.label ?? null;

  /** The rules' verdict on what is in the form, for anything but a draft. */
  function check(): boolean {
    const found = otherProblems(program, readOtherInput(program, contentOf(program, values)), earliestDeadline);
    if (creating) found.push(...createPanelProblems(values.panel, candidateName));
    setProblems(found);
    return found.length === 0;
  }

  async function send(action: OtherFormAction) {
    if (sending) return;
    setFailure(null);
    setSending(true);
    const answer = await onSend(action, values);
    setSending(false);
    setConfirming(false);
    if (answer.kind === "saved") {
      setProblems([]);
      onSaved(answer.opportunity);
      return;
    }
    if (answer.kind === "refused") {
      const named = answer.reasons.map(otherProblemFromLine).filter((problem): problem is OtherProblem => problem !== null);
      if (named.length > 0) setProblems(named);
      const rest = answer.reasons.filter((reason) => otherProblemFromLine(reason) === null);
      if (rest.length > 0 || named.length === 0) setFailure(rest);
      return;
    }
    setFailure([]);
  }

  function attempt(action: OtherFormAction) {
    if (action === "draft" || (action === "save" && isDraft)) {
      setProblems([]);
      void send(action);
      return;
    }
    if (!check()) return;
    if (action === "publish") setConfirming(true);
    else void send(action);
  }

  const primary: OtherFormAction = creating ? (administrator ? "publish" : "submit") : "save";

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
      isReadOnly={readOnly}
      description={description}
      value={values[field]}
      onChange={(value) => change(field, value)}
      {...invalid(field)}
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

  const total = weightTotal(program, values.weights as Partial<Record<keyof WeightsDraft, number>>);
  const weightsEntered = WEIGHT_FIELDS[program].some((field) => !Number.isNaN(values.weights[field] ?? Number.NaN));
  const weightProblem = problemFor("scoringWeights");
  const phaseProblems = problems.filter((problem) => problem.field === "phases");
  const memberProblem = (number: number) =>
    problems
      .filter((problem) => problem.field === "evaluationPanel" && problem.message.startsWith(`Panel member ${number}: `))
      .map((problem) => problem.message.slice(`Panel member ${number}: `.length))
      .join(" ");
  const panelGroupProblems = problems.filter((problem) => problem.field === "evaluationPanel" && !/^Panel member \d+: /.test(problem.message));

  return (
    <>
      {problems.length > 0 ? (
        <div tabIndex={-1} ref={summaryRef}>
          <TitledAlert
            variant="danger"
            role="alert"
            title={`${creating ? "This opportunity has" : "Your changes have"} ${problems.length} ${problems.length === 1 ? "problem" : "problems"}`}
          >
            <ul>
              {problems.map((problem, index) => (
                <li key={`${problem.field}-${index}`} data-testid="field-error">
                  <Link href={`#${otherFieldId(program, problem.field)}`}>
                    {`${otherFieldLabel(program, problem.field)}: ${lowerFirst(problem.message)}`}
                  </Link>
                </li>
              ))}
            </ul>
          </TitledAlert>
        </div>
      ) : null}
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
        onSubmit={(event) => {
          event.preventDefault();
          if (!readOnly) attempt(primary);
        }}
      >
        <Stack gap="medium">
          <section aria-labelledby="form-overview" style={card}>
            <Stack gap="medium">
              <Heading level={H} id="form-overview">
                Overview
              </Heading>
              <TextField
                id="opp-title"
                label="Title"
                isRequired
                isReadOnly={readOnly}
                description={`Up to ${TITLE_MAX} characters.`}
                value={values.title}
                onChange={(value) => change("title", value)}
                {...invalid("title")}
                data-testid="opportunity-title-field"
              />
              <TextArea
                id="opp-teaser"
                label="Teaser (optional)"
                isReadOnly={readOnly}
                description={`A sentence or two shown in the opportunity list. Up to ${TEASER_MAX} characters.`}
                value={values.teaser}
                onChange={(value) => change("teaser", value)}
                {...invalid("teaser")}
                data-testid="opportunity-teaser-field"
              />
              <TextField
                id="opp-location"
                label="Location"
                isRequired
                isReadOnly={readOnly}
                value={values.location}
                onChange={(value) => change("location", value)}
                {...invalid("location")}
                data-testid="opportunity-location-field"
              />
              <RadioGroup
                id="opp-remote"
                label="Is remote work acceptable?"
                isRequired
                isReadOnly={readOnly}
                value={values.remoteOk ? "yes" : "no"}
                onChange={(value) => change("remoteOk", value === "yes")}
                {...invalid("remoteOk")}
                data-testid="opportunity-remote-field"
              >
                <Radio value="yes">Yes</Radio>
                <Radio value="no">No</Radio>
              </RadioGroup>
              <TextArea
                id="opp-remote-description"
                label="Remote work description"
                isRequired={values.remoteOk}
                isReadOnly={readOnly}
                description={`Say what remote work involves. Required when remote work is acceptable. Up to ${REMOTE_DESC_MAX} characters.`}
                value={values.remoteDesc}
                onChange={(value) => change("remoteDesc", value)}
                {...invalid("remoteDesc")}
                data-testid="opportunity-remote-description-field"
              />
            </Stack>
          </section>
          <section aria-labelledby="form-budget" style={card}>
            <Stack gap="medium">
              <Heading level={H} id="form-budget">
                {words.budgetHeading}
              </Heading>
              <NumberField
                id="opp-budget"
                label={words.budget}
                isRequired
                isReadOnly={readOnly}
                description={words.budgetRule}
                formatOptions={currency}
                value={values.budget}
                onChange={(value) => change("budget", value)}
                {...invalid(PROGRAM_TERMS[program].budgetKey)}
                data-testid="opportunity-budget-field"
              />
              <Text elementType="p">
                What the service commits to, and what it asks of you, is set out in the{" "}
                <Link href="/content/service-level-agreement" data-testid="service-level-agreement-link">
                  service level agreement
                </Link>
                .
              </Text>
              {sprint ? (
                <Select
                  id="opp-skills"
                  label="Skills"
                  selectionMode="multiple"
                  isRequired
                  isDisabled={readOnly}
                  description="Choose at least one skill."
                  items={[...new Set([...CWU_SKILLS, ...values.skills])].map((skill) => ({ id: skill, label: skill }))}
                  value={values.skills}
                  onChange={(keys) => change("skills", (keys as readonly (string | number)[]).map(String))}
                  {...invalid("mandatorySkills")}
                  data-testid="opportunity-skills-field"
                />
              ) : null}
            </Stack>
          </section>
          <section aria-labelledby="form-description" style={card}>
            <Stack gap="medium">
              <Heading level={H} id="form-description">
                Description
              </Heading>
              <TextArea
                id="opp-description"
                label="Description"
                isRequired
                isReadOnly={readOnly}
                description={`Formatted text, up to ${DESCRIPTION_MAX.toLocaleString("en-CA")} characters.`}
                value={values.description}
                onChange={(value) => change("description", value)}
                {...invalid("description")}
                data-testid="opportunity-description-field"
              />
            </Stack>
          </section>
          <section aria-labelledby="form-dates" style={card}>
            <Stack gap="medium">
              <Heading level={H} id="form-dates">
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
            </Stack>
          </section>
          {sprint ? (
            <section aria-labelledby="form-phases" style={card}>
              <Stack gap="medium">
                <Heading level={H} id="form-phases">
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
                    <fieldset key={phase} style={group} aria-describedby={phaseProblems.length > 0 ? "opp-phases-error" : undefined}>
                      <legend style={legend}>{`${name} phase`}</legend>
                      <Stack gap="medium">
                        <TextField
                          id={`opp-${key}-start`}
                          type="date"
                          label="Start date"
                          isRequired
                          isReadOnly={readOnly}
                          value={entry.startDate}
                          onChange={(value) => setPhase(phase, { ...entry, startDate: value })}
                          {...invalid(`${PHASE_KEYS[phase]}.startDate`)}
                          data-testid="phase-start-date-field"
                        />
                        <TextField
                          id={`opp-${key}-completion`}
                          type="date"
                          label="Completion date"
                          isRequired
                          isReadOnly={readOnly}
                          value={entry.completionDate}
                          onChange={(value) => setPhase(phase, { ...entry, completionDate: value })}
                          {...invalid(`${PHASE_KEYS[phase]}.completionDate`)}
                          data-testid="phase-completion-date-field"
                        />
                        {phase === "IMPLEMENTATION" || readOnly ? null : (
                          <div>
                            <Button variant="tertiary" size="small" onPress={() => setPhase(phase, null)}>
                              {`Remove ${name.toLowerCase()} phase`}
                            </Button>
                          </div>
                        )}
                      </Stack>
                    </fieldset>
                  );
                })}
                {phaseProblems.length > 0 ? (
                  <Text elementType="p" color="danger" id="opp-phases-error">
                    {phaseProblems.map((problem) => problem.message).join(" ")}
                  </Text>
                ) : null}
                {!readOnly && ADDABLE_PHASES.some((phase) => !values.phases[phase]) ? (
                  <Stack direction="row" align="end" gap="medium">
                    {ADDABLE_PHASES.filter((phase) => !values.phases[phase]).map((phase) => (
                      <Button key={phase} variant="secondary" onPress={() => setPhase(phase, BLANK_PHASE)} data-testid="add-phase-button">
                        {`Add ${phase === "INCEPTION" ? "an inception" : "a prototype"} phase`}
                      </Button>
                    ))}
                  </Stack>
                ) : null}
              </Stack>
            </section>
          ) : (
            <section aria-labelledby="form-resources-heading" style={card} id="form-resources">
              <Stack gap="medium">
                <Heading level={H} id="form-resources-heading">
                  Resources
                </Heading>
                <Text elementType="p">Each resource names one service area and how much of a full-time week it needs.</Text>
                {problemFor("resources") ? (
                  <Text elementType="p" color="danger">
                    {problemFor("resources")}
                  </Text>
                ) : null}
                {values.resources.map((resource, index) => {
                  const number = index + 1;
                  return (
                    <fieldset key={index} style={group}>
                      <legend style={legend}>{`Resource ${number}`}</legend>
                      <Stack gap="medium">
                        <Select
                          id={`opp-resource-${number}-area`}
                          label="Service area"
                          isRequired
                          isDisabled={readOnly}
                          items={SERVICE_AREAS.map((area) => ({ id: area.key, label: area.name }))}
                          value={resource.serviceArea === "" ? null : resource.serviceArea}
                          onChange={(key) => change("resources", changeAt(values.resources, index, { serviceArea: key === null ? "" : String(key) }))}
                          {...invalid(`resources.${number}.serviceArea`)}
                          data-testid="resource-service-area-field"
                        />
                        <NumberField
                          id={`opp-resource-${number}-allocation`}
                          label="Target allocation (% of full time)"
                          isRequired
                          isReadOnly={readOnly}
                          description="Between 1 and 100."
                          value={resource.targetAllocation}
                          onChange={(value) => change("resources", changeAt(values.resources, index, { targetAllocation: value }))}
                          {...invalid(`resources.${number}.targetAllocation`)}
                          data-testid="resource-allocation-field"
                        />
                        {readOnly ? null : (
                          <div>
                            <Button
                              variant="tertiary"
                              size="small"
                              onPress={() => change("resources", values.resources.filter((_, at) => at !== index))}
                            >
                              {`Remove resource ${number}`}
                            </Button>
                          </div>
                        )}
                      </Stack>
                    </fieldset>
                  );
                })}
                {readOnly ? null : (
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
                )}
              </Stack>
            </section>
          )}
          <section aria-labelledby={words.questionsId} style={card}>
            <Stack gap="medium">
              <Heading level={H} id={words.questionsId}>
                {words.questionsHeading}
              </Heading>
              <Text elementType="p">{`Questions are numbered in the order they appear here. You can add up to ${QUESTIONS_MAX}.`}</Text>
              {problemFor(PROGRAM_TERMS[program].questionsKey) ? (
                <Text elementType="p" color="danger">
                  {problemFor(PROGRAM_TERMS[program].questionsKey)}
                </Text>
              ) : null}
              {values.questions.map((question, index) => {
                const number = index + 1;
                const field = `${PROGRAM_TERMS[program].questionsKey}.${number}`;
                const set = (patch: Partial<QuestionEntry>) => change("questions", changeAt(values.questions, index, patch));
                return (
                  <fieldset key={index} style={group} data-testid="evaluation-question">
                    <legend style={legend}>{`Question ${number}`}</legend>
                    <Stack gap="medium">
                      <TextArea
                        id={`opp-question-${number}`}
                        label="Question"
                        isRequired
                        isReadOnly={readOnly}
                        description="Up to 1,000 characters."
                        value={question.question}
                        onChange={(value) => set({ question: value })}
                        {...invalid(`${field}.question`)}
                        data-testid="question-text-field"
                      />
                      <TextArea
                        id={`opp-question-${number}-guideline`}
                        label="Guideline for evaluators"
                        isRequired
                        isReadOnly={readOnly}
                        description="What a strong answer covers. Up to 1,000 characters."
                        value={question.guideline}
                        onChange={(value) => set({ guideline: value })}
                        {...invalid(`${field}.guideline`)}
                        data-testid="question-guideline-field"
                      />
                      <NumberField
                        id={`opp-question-${number}-score`}
                        label="Maximum score"
                        isRequired
                        isReadOnly={readOnly}
                        description="At least 1."
                        value={question.score}
                        onChange={(value) => set({ score: value })}
                        {...invalid(`${field}.score`)}
                        data-testid="question-score-field"
                      />
                      <NumberField
                        id={`opp-question-${number}-minimum`}
                        label="Minimum score (optional)"
                        isReadOnly={readOnly}
                        description="Lower than the maximum score."
                        value={question.minimumScore}
                        onChange={(value) => set({ minimumScore: value })}
                        {...invalid(`${field}.minimumScore`)}
                        data-testid="question-minimum-score-field"
                      />
                      <NumberField
                        id={`opp-question-${number}-word-limit`}
                        label="Response word limit"
                        isRequired
                        isReadOnly={readOnly}
                        description="Between 1 and 3,000 words."
                        value={question.wordLimit}
                        onChange={(value) => set({ wordLimit: value })}
                        {...invalid(`${field}.wordLimit`)}
                        data-testid="question-word-limit-field"
                      />
                      {readOnly ? null : (
                        <div>
                          <Button
                            variant="tertiary"
                            size="small"
                            onPress={() => change("questions", values.questions.filter((_, at) => at !== index))}
                          >
                            {`Remove question ${number}`}
                          </Button>
                        </div>
                      )}
                    </Stack>
                  </fieldset>
                );
              })}
              {readOnly ? null : (
                <div>
                  <Button
                    variant="secondary"
                    isDisabled={values.questions.length >= QUESTIONS_MAX}
                    onPress={() => change("questions", [...values.questions, BLANK_QUESTION])}
                    data-testid={words.addQuestionTestId}
                  >
                    {words.addQuestion}
                  </Button>
                </div>
              )}
            </Stack>
          </section>
          <section aria-labelledby="form-weights" style={card}>
            <Stack gap="medium">
              <Heading level={H} id="form-weights">
                Scoring weights
              </Heading>
              <Text elementType="p">{words.weightRule}</Text>
              <Stack direction="row" align="end" gap="medium">
                {WEIGHT_FIELDS[program].map((field) => {
                  const weight = WEIGHT_WORDS[program][field] as { label: string; id: string };
                  return (
                    <NumberField
                      key={field}
                      id={weight.id}
                      label={weight.label}
                      isRequired
                      isReadOnly={readOnly}
                      description="0 to 100."
                      value={values.weights[field] ?? Number.NaN}
                      onChange={(value) => change("weights", { ...values.weights, [field]: value })}
                      {...invalid(WEIGHT_KEYS[field])}
                      aria-describedby="opp-weights-error"
                      data-testid="score-weight-field"
                    />
                  );
                })}
              </Stack>
              <div role="status">
                <Text elementType="p">{`Total: ${total}%`}</Text>
              </div>
              {(weightsEntered && total !== 100) || weightProblem ? (
                <Text elementType="p" color="danger" id="opp-weights-error" data-testid="score-weight-error">
                  The scoring weights must total 100%.
                </Text>
              ) : null}
            </Stack>
          </section>
          {creating ? (
            <section aria-labelledby="form-panel-heading" style={card} id="form-panel">
              <Stack gap="medium">
                <Heading level={H} id="form-panel-heading">
                  Evaluation panel
                </Heading>
                <Stack gap="medium" data-testid="evaluation-panel-editor">
                  <Text elementType="p">
                    Name at least two public sector employees and mark exactly one of them as chair. The panel can be changed until the
                    consensus stage begins.
                  </Text>
                  {values.panel.map((member, index) => {
                    const number = index + 1;
                    const set = (patch: Partial<PanelEntry>) => change("panel", changeAt(values.panel, index, patch));
                    const problem = memberProblem(number);
                    return (
                      <fieldset key={index} style={group} id={`panel-member-${number}`} data-testid="evaluation-panel-member-row">
                        <legend style={legend}>{`Panel member ${number}`}</legend>
                        <Stack gap="medium">
                          <Select
                            label="Public sector employee"
                            isRequired
                            items={[...candidates]}
                            value={member.user === "" ? null : member.user}
                            onChange={(key) => set({ user: key === null ? "" : String(key) })}
                            isInvalid={problem !== ""}
                            errorMessage={problem || undefined}
                            data-testid="evaluation-panel-member-field"
                          />
                          <Checkbox isSelected={member.evaluator} onChange={(evaluator) => set({ evaluator })}>
                            Evaluator
                          </Checkbox>
                          <Checkbox
                            isSelected={member.chair}
                            onChange={(chair) => set({ chair })}
                            aria-label={`Chair: panel member ${number}`}
                            data-testid="evaluation-panel-member-chair"
                          >
                            Chair
                          </Checkbox>
                          <div>
                            <Button
                              variant="tertiary"
                              size="small"
                              onPress={() => change("panel", values.panel.filter((_, at) => at !== index))}
                              data-testid="evaluation-panel-remove-member"
                            >
                              {`Remove panel member ${number}`}
                            </Button>
                          </div>
                        </Stack>
                      </fieldset>
                    );
                  })}
                  {panelGroupProblems.length > 0 ? (
                    <Text elementType="p" color="danger">
                      {panelGroupProblems.map((problem) => problem.message).join(" ")}
                    </Text>
                  ) : null}
                  <div>
                    <Button
                      variant="secondary"
                      isDisabled={values.panel.length >= LIST_MAX}
                      onPress={() => change("panel", [...values.panel, BLANK_MEMBER])}
                      data-testid="evaluation-panel-add-member"
                    >
                      Add a panel member
                    </Button>
                  </div>
                </Stack>
              </Stack>
            </section>
          ) : null}
          {creating ? (
            <section aria-labelledby="form-attachments" style={card}>
              <Stack gap="medium">
                <Heading level={H} id="form-attachments">
                  Attachments
                </Heading>
                <Text elementType="p">
                  {`Files cannot be attached to a ${program === "sprint-with-us" ? "Sprint With Us" : "Team With Us"} opportunity in this version of the service. Code With Us opportunities take attachments.`}
                </Text>
                <div>
                  <Button variant="secondary" isDisabled data-testid="attachment-add-button">
                    Add attachment
                  </Button>
                </div>
              </Stack>
            </section>
          ) : null}
          {readOnly ? null : consequence}
          {readOnly ? null : (
            <ButtonGroup ariaLabel={creating ? "Opportunity actions" : "Form actions"}>
              {creating ? (
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
        </Stack>
      </Form>
      <PublishDialog isOpen={confirming} isSending={sending} onCancel={() => setConfirming(false)} onConfirm={() => void send("publish")} />
    </>
  );
}
