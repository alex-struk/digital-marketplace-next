import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import {
  Button,
  ButtonGroup,
  DatePicker,
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
import { PageContainer, Stack } from "./layout";

// opportunity-swu-edit · editing — an administrator editing a published opportunity's details; saving records a new
// version and notifies watchers, proponents and the author (R-1.4, R-1.35, R-1.56). Once the opportunity exists its
// panel is changed on the Evaluation panel tab, not here. Invalid input is presented exactly as in
// opportunity-swu-create · invalid.
const meta: Meta = { title: "opportunities/opportunity-swu-edit/editing" };
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
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const currency = { style: "currency", currency: "CAD", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 } as const;
const base = "/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/edit";

// Illustrative only: the spec does not carry the service's list of skills.
const skills = [
  { id: "react", label: "React" },
  { id: "typescript", label: "TypeScript" },
  { id: "accessibility", label: "Accessibility" },
  { id: "postgresql", label: "PostgreSQL" },
];

export const Editing: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Manage a Sprint With Us opportunity</Text>
          <Heading level={1}>Modernize the licence renewal service</Heading>
        </Stack>
        <Stack direction="row" align="center" gap="medium">
          <Text elementType="p">Status: <span style={badge} data-testid="opportunity-status">Published</span></Text>
          <Text elementType="p" size="small" color="secondary">
            Opportunity ID: <span data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000201</span>
          </Text>
        </Stack>
        <nav aria-label="Opportunity sections">
          <Stack as="ul" direction="row" gap="medium">
            <li><Link href={`${base}?tab=summary`} data-testid="opportunity-tab-summary">Summary</Link></li>
            <li><Link href={`${base}?tab=opportunity`} aria-current="page" data-testid="opportunity-tab-opportunity">Opportunity</Link></li>
            <li><Link href={`${base}?tab=addenda`} data-testid="opportunity-tab-addenda">Addenda</Link></li>
            <li><Link href={`${base}?tab=history`} data-testid="opportunity-tab-history">History</Link></li>
            <li><Link href={`${base}?tab=evaluationPanel`} data-testid="opportunity-tab-evaluation-panel">Evaluation panel</Link></li>
          </Stack>
        </nav>
        <Stack as="section" gap="medium" aria-labelledby="tab-heading">
          <Heading level={2} id="tab-heading">Opportunity</Heading>
          <Form validationBehavior="aria">
            <Stack gap="medium">
              <section aria-labelledby="form-overview" style={panel}>
                <Stack gap="medium">
                  <Heading level={3} id="form-overview">Overview</Heading>
                  <TextField
                    id="opp-title"
                    label="Title"
                    isRequired
                    maxLength={200}
                    description="Up to 200 characters."
                    defaultValue="Modernize the licence renewal service"
                    data-testid="opportunity-title-field"
                  />
                  <TextArea
                    id="opp-teaser"
                    label="Teaser (optional)"
                    maxLength={500}
                    description="A sentence or two shown in the opportunity list. Up to 500 characters."
                    defaultValue="Rebuild licence renewals as an accessible, cloud-hosted service."
                    data-testid="opportunity-teaser-field"
                  />
                  <TextField id="opp-location" label="Location" isRequired defaultValue="Victoria" data-testid="opportunity-location-field" />
                  <RadioGroup id="opp-remote" label="Is remote work acceptable?" isRequired defaultValue="yes" data-testid="opportunity-remote-field">
                    <Radio value="yes">Yes</Radio>
                    <Radio value="no">No</Radio>
                  </RadioGroup>
                  <TextArea
                    id="opp-remote-description"
                    label="Remote work description"
                    isRequired
                    maxLength={500}
                    description="Say what remote work involves. Required when remote work is acceptable. Up to 500 characters."
                    defaultValue="The team may work remotely within Canada."
                    data-testid="opportunity-remote-description-field"
                  />
                </Stack>
              </section>
              <section aria-labelledby="form-budget" style={panel}>
                <Stack gap="medium">
                  <Heading level={3} id="form-budget">Budget and skills</Heading>
                  <NumberField
                    id="opp-budget"
                    label="Total maximum budget"
                    isRequired
                    description="Between $1 and $5,000,000."
                    formatOptions={currency}
                    defaultValue={1200000}
                    data-testid="opportunity-budget-field"
                  />
                  <Select
                    id="opp-skills"
                    label="Skills"
                    selectionMode="multiple"
                    isRequired
                    description="Choose at least one skill."
                    items={skills}
                    defaultValue={["react", "postgresql"]}
                    data-testid="opportunity-skills-field"
                  />
                </Stack>
              </section>
              <section aria-labelledby="form-description" style={panel}>
                <Stack gap="medium">
                  <Heading level={3} id="form-description">Description</Heading>
                  <TextArea
                    id="opp-description"
                    label="Description"
                    isRequired
                    maxLength={10000}
                    description="Formatted text, up to 10,000 characters."
                    defaultValue="Licence holders renew on paper today. This opportunity replaces that with an online service that meets WCAG 2.1 AA, built in phases with the ministry's product team."
                    data-testid="opportunity-description-field"
                  />
                </Stack>
              </section>
              <section aria-labelledby="form-dates" style={panel}>
                <Stack gap="medium">
                  <Heading level={3} id="form-dates">Key dates</Heading>
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
                  <Heading level={3} id="form-phases">Phases</Heading>
                  <Text elementType="p">
                    Every Sprint With Us opportunity has an implementation phase. An inception phase can be added only together
                    with a prototype phase.
                  </Text>
                  <fieldset style={group}>
                    <legend style={legend}>Prototype phase</legend>
                    <Stack gap="medium">
                      <DatePicker id="opp-prototype-start" label="Start date" isRequired data-testid="phase-start-date-field" />
                      <DatePicker id="opp-prototype-completion" label="Completion date" isRequired data-testid="phase-completion-date-field" />
                      <div>
                        <Button variant="tertiary" size="small">Remove prototype phase</Button>
                      </div>
                    </Stack>
                  </fieldset>
                  <fieldset style={group}>
                    <legend style={legend}>Implementation phase</legend>
                    <Stack gap="medium">
                      <DatePicker id="opp-implementation-start" label="Start date" isRequired data-testid="phase-start-date-field" />
                      <DatePicker id="opp-implementation-completion" label="Completion date" isRequired data-testid="phase-completion-date-field" />
                    </Stack>
                  </fieldset>
                  <Stack direction="row" align="end" gap="medium">
                    <Button variant="secondary" data-testid="add-phase-button">Add an inception phase</Button>
                  </Stack>
                </Stack>
              </section>
              <section aria-labelledby="form-team-questions" style={panel}>
                <Stack gap="medium">
                  <Heading level={3} id="form-team-questions">Team questions</Heading>
                  <Text elementType="p">Questions are numbered in the order they appear here. You can add up to 100.</Text>
                  <fieldset style={group}>
                    <legend style={legend}>Question 1</legend>
                    <Stack gap="medium">
                      <TextArea
                        id="opp-question-1"
                        label="Question"
                        isRequired
                        maxLength={1000}
                        description="Up to 1,000 characters."
                        defaultValue="Describe a service your team delivered that people with disabilities rely on."
                        data-testid="question-text-field"
                      />
                      <TextArea
                        id="opp-question-1-guideline"
                        label="Guideline for evaluators"
                        isRequired
                        maxLength={1000}
                        description="What a strong answer covers. Up to 1,000 characters."
                        defaultValue="Look for evidence of testing with assistive technology."
                        data-testid="question-guideline-field"
                      />
                      <NumberField id="opp-question-1-score" label="Maximum score" isRequired description="At least 1." defaultValue={5} data-testid="question-score-field" />
                      <NumberField
                        id="opp-question-1-minimum"
                        label="Minimum score (optional)"
                        description="Lower than the maximum score."
                        defaultValue={2}
                        data-testid="question-minimum-score-field"
                      />
                      <NumberField
                        id="opp-question-1-word-limit"
                        label="Response word limit"
                        isRequired
                        description="Between 1 and 3,000 words."
                        defaultValue={500}
                        data-testid="question-word-limit-field"
                      />
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
                  <Heading level={3} id="form-weights">Scoring weights</Heading>
                  <Text elementType="p">Enter each weight as a percentage. The four weights must total 100%.</Text>
                  <Stack direction="row" align="end" gap="medium">
                    <NumberField id="opp-weight-questions" label="Team questions (%)" isRequired description="0 to 100." defaultValue={30} data-testid="score-weight-field" />
                    <NumberField id="opp-weight-code-challenge" label="Code challenge (%)" isRequired description="0 to 100." defaultValue={30} data-testid="score-weight-field" />
                    <NumberField id="opp-weight-team-scenario" label="Team scenario (%)" isRequired description="0 to 100." defaultValue={20} data-testid="score-weight-field" />
                    <NumberField id="opp-weight-price" label="Price (%)" isRequired description="0 to 100." defaultValue={20} data-testid="score-weight-field" />
                  </Stack>
                  <div role="status">
                    <Text elementType="p">Total: 100%</Text>
                  </div>
                </Stack>
              </section>
              <section aria-labelledby="form-attachments" style={panel}>
                <Stack gap="medium">
                  <Heading level={3} id="form-attachments">Attachments</Heading>
                  <Text elementType="p">Attach any documents proponents need. The accepted file types and size limit are shown when you choose a file.</Text>
                  <div>
                    <FileTrigger>
                      <Button variant="secondary" data-testid="attachment-add-button">Add attachment</Button>
                    </FileTrigger>
                  </div>
                </Stack>
              </section>
              <Text elementType="p">
                Saving records a new version. Everyone watching this opportunity, everyone who has submitted a proposal, and its
                author will be emailed.
              </Text>
              <ButtonGroup ariaLabel="Form actions">
                <Button type="submit" variant="primary" data-testid="opportunity-save-changes">Save changes</Button>
                <Button variant="secondary" data-testid="opportunity-cancel-edit">Cancel</Button>
              </ButtonGroup>
            </Stack>
          </Form>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
