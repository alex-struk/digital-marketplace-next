import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import {
  Button,
  ButtonGroup,
  Checkbox,
  DatePicker,
  Form,
  Heading,
  InlineAlert,
  Link,
  NumberField,
  Radio,
  RadioGroup,
  Select,
  Text,
  TextArea,
  TextField,
} from "@bcgov/design-system-react-components";

// opportunity-twu-create · invalid — submitted for review with problems: no title, a resource allocation over 100%,
// and weights that do not total 100% (R-1.10, R-1.15, R-1.18)
const meta: Meta = { title: "opportunities/opportunity-twu-create/invalid" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "end", gap: "var(--layout-margin-medium)" } as const;
const panel = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const group = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const legend = { paddingInline: "var(--layout-padding-small)", font: "var(--typography-bold-body)" } as const;
const currency = { style: "currency", currency: "CAD", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 } as const;

// Illustrative only: the spec says there are five recognised service areas but does not name them.
const serviceAreas = [
  { id: "full-stack-developer", label: "Full stack developer" },
  { id: "data-professional", label: "Data professional" },
  { id: "agile-coach", label: "Agile coach" },
  { id: "devops-specialist", label: "DevOps specialist" },
  { id: "service-designer", label: "Service designer" },
];
const publicServants = [
  { id: "u-ps-1", label: "Test Public Servant" },
  { id: "u-ps-2", label: "Test Evaluator One" },
  { id: "u-ps-3", label: "Test Evaluator Two" },
];

export const Invalid: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Create a Team With Us opportunity</Heading>
      <Text elementType="p">Required fields are needed to submit for review or publish. A draft can be saved with any of them blank.</Text>
      <div tabIndex={-1}>
        <InlineAlert variant="danger" title="This opportunity has 3 problems" role="alert">
          <ul>
            <li data-testid="field-error"><Link href="#opp-title">Title: enter a title</Link></li>
            <li data-testid="field-error"><Link href="#opp-resource-1-allocation">Resource 1, target allocation: enter a target allocation between 1 and 100</Link></li>
            <li data-testid="field-error"><Link href="#opp-weights-error">Scoring weights: the scoring weights must total 100%</Link></li>
          </ul>
        </InlineAlert>
      </div>
      <Form validationBehavior="aria" style={stack}>
        <section aria-labelledby="form-overview" style={panel}>
          <Heading level={2} id="form-overview">Overview</Heading>
          <TextField
            id="opp-title"
            label="Title"
            isRequired
            maxLength={200}
            description="Up to 200 characters."
            defaultValue=""
            isInvalid
            errorMessage="Enter a title"
            data-testid="opportunity-title-field"
          />
          <TextArea
            id="opp-teaser"
            label="Teaser (optional)"
            maxLength={500}
            description="A sentence or two shown in the opportunity list. Up to 500 characters."
            data-testid="opportunity-teaser-field"
          />
          <TextField id="opp-location" label="Location" isRequired defaultValue="Victoria" data-testid="opportunity-location-field" />
          <RadioGroup id="opp-remote" label="Is remote work acceptable?" isRequired defaultValue="no" data-testid="opportunity-remote-field">
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
        </section>
        <section aria-labelledby="form-budget" style={panel}>
          <Heading level={2} id="form-budget">Budget</Heading>
          <NumberField
            id="opp-budget"
            label="Maximum budget"
            isRequired
            description="At least $1."
            formatOptions={currency}
            defaultValue={900000}
            data-testid="opportunity-budget-field"
          />
        </section>
        <section aria-labelledby="form-description" style={panel}>
          <Heading level={2} id="form-description">Description</Heading>
          <TextArea
            id="opp-description"
            label="Description"
            isRequired
            maxLength={10000}
            description="Formatted text, up to 10,000 characters."
            defaultValue="The data platform team publishes open data for the ministry."
            data-testid="opportunity-description-field"
          />
        </section>
        <section aria-labelledby="form-dates" style={panel}>
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
          <DatePicker id="opp-start" label="Start date" isRequired description="On or after the assignment date." data-testid="opportunity-start-date-field" />
          <DatePicker id="opp-completion" label="Completion date (optional)" description="On or after the start date." data-testid="opportunity-completion-date-field" />
        </section>
        <section aria-labelledby="form-resources" style={panel}>
          <Heading level={2} id="form-resources">Resources</Heading>
          <Text elementType="p">Each resource names one service area and how much of a full-time week it needs.</Text>
          <fieldset style={group}>
            <legend style={legend}>Resource 1</legend>
            <Select
              id="opp-resource-1-area"
              label="Service area"
              isRequired
              items={serviceAreas}
              defaultValue="full-stack-developer"
              data-testid="resource-service-area-field"
            />
            <NumberField
              id="opp-resource-1-allocation"
              label="Target allocation (% of full time)"
              isRequired
              description="Between 1 and 100."
              defaultValue={120}
              isInvalid
              errorMessage="Enter a target allocation between 1 and 100"
              data-testid="resource-allocation-field"
            />
            <div>
              <Button variant="tertiary" size="small">Remove resource 1</Button>
            </div>
          </fieldset>
          <div>
            <Button variant="secondary" data-testid="add-resource-button">Add a resource</Button>
          </div>
        </section>
        <section aria-labelledby="form-resource-questions" style={panel}>
          <Heading level={2} id="form-resource-questions">Resource questions</Heading>
          <Text elementType="p">Questions are numbered in the order they appear here. You can add up to 100.</Text>
          <fieldset style={group}>
            <legend style={legend}>Question 1</legend>
            <TextArea
              id="opp-question-1"
              label="Question"
              isRequired
              maxLength={1000}
              description="Up to 1,000 characters."
              defaultValue="Describe a data pipeline you moved to a new platform."
              data-testid="question-text-field"
            />
            <TextArea
              id="opp-question-1-guideline"
              label="Guideline for evaluators"
              isRequired
              maxLength={1000}
              description="What a strong answer covers. Up to 1,000 characters."
              defaultValue="Look for a plan that kept the data available during the move."
              data-testid="question-guideline-field"
            />
            <NumberField id="opp-question-1-score" label="Maximum score" isRequired description="At least 1." defaultValue={5} data-testid="question-score-field" />
            <NumberField id="opp-question-1-minimum" label="Minimum score (optional)" description="Lower than the maximum score." data-testid="question-minimum-score-field" />
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
          </fieldset>
          <div>
            <Button variant="secondary" data-testid="add-resource-question-button">Add a resource question</Button>
          </div>
        </section>
        <section aria-labelledby="form-weights" style={panel}>
          <Heading level={2} id="form-weights">Scoring weights</Heading>
          <Text elementType="p">Enter each weight as a percentage. The three weights must total 100%.</Text>
          <div style={row}>
            <NumberField id="opp-weight-questions" label="Resource questions (%)" isRequired description="0 to 100." defaultValue={30} aria-describedby="opp-weights-error" data-testid="score-weight-field" />
            <NumberField id="opp-weight-challenge" label="Challenge (%)" isRequired description="0 to 100." defaultValue={40} aria-describedby="opp-weights-error" data-testid="score-weight-field" />
            <NumberField id="opp-weight-price" label="Price (%)" isRequired description="0 to 100." defaultValue={20} aria-describedby="opp-weights-error" data-testid="score-weight-field" />
          </div>
          <div role="status">
            <Text elementType="p">Total: 90%</Text>
          </div>
          <Text elementType="p" color="danger" id="opp-weights-error" data-testid="score-weight-error">The scoring weights must total 100%.</Text>
        </section>
        <section aria-labelledby="form-panel" style={panel}>
          <Heading level={2} id="form-panel">Evaluation panel</Heading>
          <div style={stack} data-testid="evaluation-panel-editor">
            <Text elementType="p">
              Name at least two public sector employees and mark exactly one of them as chair. The panel can be changed until
              the consensus stage begins.
            </Text>
            <fieldset style={group}>
              <legend style={legend}>Panel member 1</legend>
              <Select label="Public sector employee" items={publicServants} isRequired defaultValue="u-ps-2" />
              <Checkbox defaultSelected>Evaluator</Checkbox>
              <Checkbox defaultSelected>Chair</Checkbox>
            </fieldset>
            <fieldset style={group}>
              <legend style={legend}>Panel member 2</legend>
              <Select label="Public sector employee" items={publicServants} isRequired defaultValue="u-ps-3" />
              <Checkbox defaultSelected>Evaluator</Checkbox>
              <Checkbox>Chair</Checkbox>
            </fieldset>
            <div>
              <Button variant="secondary">Add a panel member</Button>
            </div>
          </div>
        </section>
        <section aria-labelledby="form-attachments" style={panel}>
          <Heading level={2} id="form-attachments">Attachments</Heading>
          <Text elementType="p">Attach any documents proponents need. The accepted file types and size limit are shown when you choose a file.</Text>
          <div>
            <FileTrigger>
              <Button variant="secondary" data-testid="attachment-add-button">Add attachment</Button>
            </FileTrigger>
          </div>
        </section>
        <Text elementType="p">
          Nothing is checked until you submit for review. An administrator publishes the opportunity after reviewing it.
        </Text>
        <ButtonGroup ariaLabel="Opportunity actions">
          <Button variant="secondary" data-testid="opportunity-save-draft">Save draft</Button>
          <Button type="submit" variant="primary" data-testid="opportunity-submit-for-review">Submit for review</Button>
        </ButtonGroup>
      </Form>
    </div>
  ),
};
