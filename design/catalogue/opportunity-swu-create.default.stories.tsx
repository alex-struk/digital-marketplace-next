import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import {
  Button,
  ButtonGroup,
  Checkbox,
  DatePicker,
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
import { PageContainer, Stack } from "./layout";

// opportunity-swu-create · default — a public sector employee starting a new Sprint With Us opportunity, with its
// phases, team questions, scoring weights and evaluation panel (R-1.9, R-1.13, R-1.15, R-1.16, R-1.17, R-1.48, R-1.55)
const meta: Meta = { title: "opportunities/opportunity-swu-create/default" };
export default meta;

const panel = {
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const group = {
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const legend = { paddingInline: "var(--layout-padding-small)", font: "var(--typography-bold-body)" } as const;
const currency = { style: "currency", currency: "CAD", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 } as const;

// Illustrative only: the spec does not carry the service's list of skills.
const skills = [
  { id: "react", label: "React" },
  { id: "typescript", label: "TypeScript" },
  { id: "accessibility", label: "Accessibility" },
  { id: "postgresql", label: "PostgreSQL" },
];
const publicServants = [
  { id: "u-ps-1", label: "Test Public Servant" },
  { id: "u-ps-2", label: "Test Evaluator One" },
  { id: "u-ps-3", label: "Test Evaluator Two" },
];

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Create a Sprint With Us opportunity</Heading>
        <Text elementType="p">Required fields are needed to submit for review or publish. A draft can be saved with any of them blank.</Text>
        <Form validationBehavior="aria">
          <Stack gap="medium">
            <section aria-labelledby="form-overview" style={panel}>
              <Stack gap="medium">
                <Heading level={2} id="form-overview">Overview</Heading>
                <TextField id="opp-title" label="Title" isRequired maxLength={200} description="Up to 200 characters." data-testid="opportunity-title-field" />
                <TextArea
                  id="opp-teaser"
                  label="Teaser (optional)"
                  maxLength={500}
                  description="A sentence or two shown in the opportunity list. Up to 500 characters."
                  data-testid="opportunity-teaser-field"
                />
                <TextField id="opp-location" label="Location" isRequired data-testid="opportunity-location-field" />
                <RadioGroup id="opp-remote" label="Is remote work acceptable?" isRequired data-testid="opportunity-remote-field">
                  <Radio value="yes">Yes</Radio>
                  <Radio value="no">No</Radio>
                </RadioGroup>
                <TextArea
                  id="opp-remote-description"
                  label="Remote work description"
                  maxLength={500}
                  description="Say what remote work involves. Required when remote work is acceptable. Up to 500 characters."
                  data-testid="opportunity-remote-description-field"
                />
              </Stack>
            </section>
            <section aria-labelledby="form-budget" style={panel}>
              <Stack gap="medium">
                <Heading level={2} id="form-budget">Budget and skills</Heading>
                <NumberField
                  id="opp-budget"
                  label="Total maximum budget"
                  isRequired
                  description="Between $1 and $5,000,000."
                  formatOptions={currency}
                  data-testid="opportunity-budget-field"
                />
                <Select
                  id="opp-skills"
                  label="Skills"
                  selectionMode="multiple"
                  isRequired
                  description="Choose at least one skill."
                  items={skills}
                  data-testid="opportunity-skills-field"
                />
              </Stack>
            </section>
            <section aria-labelledby="form-description" style={panel}>
              <Stack gap="medium">
                <Heading level={2} id="form-description">Description</Heading>
                <TextArea
                  id="opp-description"
                  label="Description"
                  isRequired
                  maxLength={10000}
                  description="Formatted text, up to 10,000 characters."
                  data-testid="opportunity-description-field"
                />
              </Stack>
            </section>
            <section aria-labelledby="form-dates" style={panel}>
              <Stack gap="medium">
                <Heading level={2} id="form-dates">Key dates</Heading>
                <Text elementType="p">Each date must fall on or after the one before it.</Text>
                <DatePicker
                  id="opp-deadline"
                  label="Proposal deadline"
                  isRequired
                  description="Proposals close at 4:00 p.m. Pacific time on this day. It cannot be before today."
                  data-testid="opportunity-deadline-field"
                />
                <DatePicker id="opp-assignment" label="Assignment date" isRequired description="On or after the proposal deadline." data-testid="opportunity-assignment-date-field" />
              </Stack>
            </section>
            <section aria-labelledby="form-phases" style={panel}>
              <Stack gap="medium">
                <Heading level={2} id="form-phases">Phases</Heading>
                <Text elementType="p">
                  Every Sprint With Us opportunity has an implementation phase. An inception phase can be added only together with
                  a prototype phase.
                </Text>
                <fieldset style={group}>
                  <legend style={legend}>Implementation phase</legend>
                  <Stack gap="medium">
                    <DatePicker id="opp-implementation-start" label="Start date" isRequired data-testid="phase-start-date-field" />
                    <DatePicker id="opp-implementation-completion" label="Completion date" isRequired data-testid="phase-completion-date-field" />
                  </Stack>
                </fieldset>
                <Stack direction="row" align="end" gap="medium">
                  <Button variant="secondary" data-testid="add-phase-button">Add an inception phase</Button>
                  <Button variant="secondary" data-testid="add-phase-button">Add a prototype phase</Button>
                </Stack>
              </Stack>
            </section>
            <section aria-labelledby="form-team-questions" style={panel}>
              <Stack gap="medium">
                <Heading level={2} id="form-team-questions">Team questions</Heading>
                <Text elementType="p">Questions are numbered in the order they appear here. You can add up to 100.</Text>
                <fieldset style={group}>
                  <legend style={legend}>Question 1</legend>
                  <Stack gap="medium">
                    <TextArea id="opp-question-1" label="Question" isRequired maxLength={1000} description="Up to 1,000 characters." data-testid="question-text-field" />
                    <TextArea
                      id="opp-question-1-guideline"
                      label="Guideline for evaluators"
                      isRequired
                      maxLength={1000}
                      description="What a strong answer covers. Up to 1,000 characters."
                      data-testid="question-guideline-field"
                    />
                    <NumberField id="opp-question-1-score" label="Maximum score" isRequired description="At least 1." data-testid="question-score-field" />
                    <NumberField id="opp-question-1-minimum" label="Minimum score (optional)" description="Lower than the maximum score." data-testid="question-minimum-score-field" />
                    <NumberField id="opp-question-1-word-limit" label="Response word limit" isRequired description="Between 1 and 3,000 words." data-testid="question-word-limit-field" />
                    <div>
                      <Button variant="tertiary" size="small">Remove question 1</Button>
                    </div>
                  </Stack>
                </fieldset>
                <div>
                  <Button variant="secondary" data-testid="add-team-question-button">Add a team question</Button>
                </div>
              </Stack>
            </section>
            <section aria-labelledby="form-weights" style={panel}>
              <Stack gap="medium">
                <Heading level={2} id="form-weights">Scoring weights</Heading>
                <Text elementType="p">Enter each weight as a percentage. The four weights must total 100%.</Text>
                <Stack direction="row" align="end" gap="medium">
                  <NumberField id="opp-weight-questions" label="Team questions (%)" isRequired description="0 to 100." data-testid="score-weight-field" />
                  <NumberField id="opp-weight-code-challenge" label="Code challenge (%)" isRequired description="0 to 100." data-testid="score-weight-field" />
                  <NumberField id="opp-weight-team-scenario" label="Team scenario (%)" isRequired description="0 to 100." data-testid="score-weight-field" />
                  <NumberField id="opp-weight-price" label="Price (%)" isRequired description="0 to 100." data-testid="score-weight-field" />
                </Stack>
                <div role="status">
                  <Text elementType="p">Total: 0%</Text>
                </div>
              </Stack>
            </section>
            <section aria-labelledby="form-panel" style={panel}>
              <Stack gap="medium">
                <Heading level={2} id="form-panel">Evaluation panel</Heading>
                <Stack gap="medium" data-testid="evaluation-panel-editor">
                  <Text elementType="p">
                    Name at least two public sector employees and mark exactly one of them as chair. The panel can be changed until
                    the consensus stage begins.
                  </Text>
                  <fieldset style={group}>
                    <legend style={legend}>Panel member 1</legend>
                    <Stack gap="medium">
                      <Select label="Public sector employee" items={publicServants} isRequired />
                      <Checkbox defaultSelected>Evaluator</Checkbox>
                      <Checkbox>Chair</Checkbox>
                    </Stack>
                  </fieldset>
                  <fieldset style={group}>
                    <legend style={legend}>Panel member 2</legend>
                    <Stack gap="medium">
                      <Select label="Public sector employee" items={publicServants} isRequired />
                      <Checkbox defaultSelected>Evaluator</Checkbox>
                      <Checkbox>Chair</Checkbox>
                    </Stack>
                  </fieldset>
                  <div>
                    <Button variant="secondary">Add a panel member</Button>
                  </div>
                </Stack>
              </Stack>
            </section>
            <section aria-labelledby="form-attachments" style={panel}>
              <Stack gap="medium">
                <Heading level={2} id="form-attachments">Attachments</Heading>
                <Text elementType="p">Attach any documents proponents need. The accepted file types and size limit are shown when you choose a file.</Text>
                <div>
                  <FileTrigger>
                    <Button variant="secondary" data-testid="attachment-add-button">Add attachment</Button>
                  </FileTrigger>
                </div>
              </Stack>
            </section>
            <Text elementType="p">
              Nothing is checked until you submit for review. An administrator publishes the opportunity after reviewing it.
            </Text>
            <ButtonGroup ariaLabel="Opportunity actions">
              <Button variant="secondary" data-testid="opportunity-save-draft">Save draft</Button>
              <Button type="submit" variant="primary" data-testid="opportunity-submit-for-review">Submit for review</Button>
            </ButtonGroup>
          </Stack>
        </Form>
      </Stack>
    </PageContainer>
  ),
};
