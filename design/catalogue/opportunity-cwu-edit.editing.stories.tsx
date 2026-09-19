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

// opportunity-cwu-edit · editing — an administrator editing a published opportunity's details; saving records a new
// version and notifies watchers, proponents and the author (R-1.4, R-1.35, R-1.56). Invalid input is presented exactly
// as in opportunity-cwu-create · invalid.
const meta: Meta = { title: "opportunities/opportunity-cwu-edit/editing" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--layout-margin-medium)" } as const;
const panel = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const tabs = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--layout-margin-large)",
  listStyle: "none",
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-none)",
} as const;
const currency = { style: "currency", currency: "CAD", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 } as const;
const base = "/opportunities/code-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000101/edit";

// Illustrative only: the spec does not carry the service's list of skills.
const skills = [
  { id: "react", label: "React" },
  { id: "typescript", label: "TypeScript" },
  { id: "accessibility", label: "Accessibility" },
  { id: "postgresql", label: "PostgreSQL" },
];

export const Editing: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a Code With Us opportunity</Text>
      <Heading level={1}>Build an accessible permit tracker</Heading>
      <div style={row}>
        <Text elementType="p">Status: <span style={badge} data-testid="opportunity-status">Published</span></Text>
        <Text elementType="p" size="small" color="secondary">
          Opportunity ID: <span data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000101</span>
        </Text>
      </div>
      <nav aria-label="Opportunity sections">
        <ul style={tabs}>
          <li><Link href={`${base}?tab=summary`} data-testid="opportunity-tab-summary">Summary</Link></li>
          <li><Link href={`${base}?tab=opportunity`} aria-current="page" data-testid="opportunity-tab-opportunity">Opportunity</Link></li>
          <li><Link href={`${base}?tab=addenda`} data-testid="opportunity-tab-addenda">Addenda</Link></li>
          <li><Link href={`${base}?tab=history`} data-testid="opportunity-tab-history">History</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Opportunity</Heading>
        <Form validationBehavior="aria" style={stack}>
          <section aria-labelledby="form-overview" style={panel}>
            <Heading level={3} id="form-overview">Overview</Heading>
            <TextField
              id="opp-title"
              label="Title"
              isRequired
              maxLength={200}
              description="Up to 200 characters."
              defaultValue="Build an accessible permit tracker"
              data-testid="opportunity-title-field"
            />
            <TextArea
              id="opp-teaser"
              label="Teaser (optional)"
              maxLength={500}
              description="A sentence or two shown in the opportunity list. Up to 500 characters."
              defaultValue="Add plain-language status tracking to the online permit application."
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
              defaultValue="Work from anywhere in Canada, with one kick-off meeting by video."
              data-testid="opportunity-remote-description-field"
            />
          </section>
          <section aria-labelledby="form-reward" style={panel}>
            <Heading level={3} id="form-reward">Reward and skills</Heading>
            <NumberField
              id="opp-reward"
              label="Reward"
              isRequired
              description="Between $1 and $70,000."
              formatOptions={currency}
              defaultValue={45000}
              data-testid="opportunity-reward-field"
            />
            <Select
              id="opp-skills"
              label="Skills"
              selectionMode="multiple"
              isRequired
              description="Choose at least one skill."
              items={skills}
              defaultValue={["react", "typescript", "accessibility"]}
              data-testid="opportunity-skills-field"
            />
          </section>
          <section aria-labelledby="form-description" style={panel}>
            <Heading level={3} id="form-description">Description</Heading>
            <TextArea
              id="opp-description"
              label="Description"
              isRequired
              maxLength={10000}
              description="Formatted text, up to 10,000 characters."
              defaultValue="The ministry runs an online permit application that tells applicants little about where their application stands. This opportunity adds a status page that works with a keyboard and a screen reader."
              data-testid="opportunity-description-field"
            />
          </section>
          <section aria-labelledby="form-dates" style={panel}>
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
            <DatePicker id="opp-start" label="Start date" isRequired description="On or after the assignment date." data-testid="opportunity-start-date-field" />
            <DatePicker id="opp-completion" label="Completion date (optional)" description="On or after the start date." data-testid="opportunity-completion-date-field" />
          </section>
          <section aria-labelledby="form-attachments" style={panel}>
            <Heading level={3} id="form-attachments">Attachments</Heading>
            <Text elementType="p">Attach any documents proponents need. The accepted file types and size limit are shown when you choose a file.</Text>
            <div>
              <FileTrigger>
                <Button variant="secondary" data-testid="attachment-add-button">Add attachment</Button>
              </FileTrigger>
            </div>
          </section>
          <Text elementType="p">
            Saving records a new version. Everyone watching this opportunity, everyone who has submitted a proposal, and its
            author will be emailed.
          </Text>
          <ButtonGroup ariaLabel="Form actions">
            <Button type="submit" variant="primary" data-testid="opportunity-save-changes">Save changes</Button>
            <Button variant="secondary" data-testid="opportunity-cancel-edit">Cancel</Button>
          </ButtonGroup>
        </Form>
      </section>
    </div>
  ),
};
