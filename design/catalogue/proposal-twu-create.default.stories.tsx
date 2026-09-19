import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import {
  Button,
  ButtonGroup,
  Form,
  Heading,
  Link,
  NumberField,
  Select,
  Text,
  TextArea,
} from "@bcgov/design-system-react-components";

// proposal-twu-create · default — a vendor bids for an organization they own or administer, naming team members
// against the opportunity's resources, each with an hourly rate. The estimated cost over the contract is shown as the
// rates change, and each resource question has its word limit stated (R-2.1, R-2.10, R-2.12, R-2.17, R-2.20, R-2.21)
const meta: Meta = { title: "proposals/proposal-twu-create/default" };
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
const list = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  listStyle: "none",
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-none)",
} as const;
const item = {
  display: "grid",
  gap: "var(--layout-margin-small)",
  padding: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const facts = { display: "flex", flexWrap: "wrap", gap: "var(--layout-margin-large)", margin: "var(--layout-margin-none)" } as const;
const fact = { display: "grid", gap: "var(--layout-margin-xsmall)" } as const;
const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { margin: "var(--layout-margin-none)" } as const;
const rate = { style: "currency", currency: "CAD", currencyDisplay: "narrowSymbol", minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;

// Illustrative only: the organizations the signed-in vendor owns or administers, and the chosen one's members.
const organizations = [
  { id: "org-1", label: "Example Digital Ltd." },
  { id: "org-2", label: "Sample Software Co-op" },
];
const members = [
  { id: "u-v-1", label: "Test Vendor" },
  { id: "u-v-2", label: "Test Developer One" },
  { id: "u-v-3", label: "Test Developer Two" },
  { id: "u-v-4", label: "Test Designer" },
];

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Create a Team With Us proposal</Heading>
      <section aria-labelledby="create-opportunity" style={panel} data-testid="proposal-opportunity-summary">
        <Heading level={2} id="create-opportunity">The opportunity</Heading>
        <dl style={facts}>
          <div style={fact}>
            <dt style={term}>Opportunity</dt>
            <dd style={detail}><Link href="/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301">Data platform team</Link></dd>
          </div>
          <div style={fact}>
            <dt style={term}>Maximum budget</dt>
            <dd style={detail}>$900,000</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Proposal deadline</dt>
            <dd style={detail}>October 2, 2026 at 4:00 p.m. Pacific time</dd>
          </div>
        </dl>
      </section>
      <Text elementType="p">A draft can be saved with any field blank. Every required field is needed to submit.</Text>
      <Form validationBehavior="aria" style={stack}>
        <section aria-labelledby="form-organization" style={panel}>
          <Heading level={2} id="form-organization">Organization</Heading>
          <Select
            id="proposal-organization"
            label="Organization"
            isRequired
            description="Organizations you own or administer. It must be a qualified supplier for Team With Us, and provide every service area this opportunity needs, before you submit."
            items={organizations}
            defaultValue="org-1"
            data-testid="proposal-organization-field"
          />
        </section>
        <section aria-labelledby="form-team" style={panel}>
          <Heading level={2} id="form-team">Team</Heading>
          <Text elementType="p">
            Name at least one team member against this opportunity's resources, with an hourly rate for each. Everyone you
            name must be an active member of the organization, and no one may be named twice.
          </Text>
          <fieldset style={group}>
            <legend style={legend}>Resource 1: Full stack developer, 100% of full time</legend>
            <ul style={list}>
              <li style={item}>
                <Text elementType="p">Test Developer One</Text>
                <NumberField
                  id="proposal-resource-1-rate-one"
                  label="Hourly rate for Test Developer One"
                  isRequired
                  description="At least $1."
                  formatOptions={rate}
                  defaultValue={150}
                  data-testid="proposal-hourly-rate-field"
                />
                <div>
                  <Button variant="tertiary" size="small" aria-label="Remove Test Developer One from resource 1">Remove</Button>
                </div>
              </li>
            </ul>
            <div style={row}>
              <Select label="Team member to add to resource 1" items={members} />
              <Button variant="secondary" aria-label="Add team member to resource 1" data-testid="proposal-add-team-member">
                Add team member
              </Button>
            </div>
          </fieldset>
          <fieldset style={group}>
            <legend style={legend}>Resource 2: Data professional, 50% of full time</legend>
            <ul style={list}>
              <li style={item}>
                <Text elementType="p">Test Developer Two</Text>
                <NumberField
                  id="proposal-resource-2-rate-two"
                  label="Hourly rate for Test Developer Two"
                  isRequired
                  description="At least $1."
                  formatOptions={rate}
                  defaultValue={140}
                  data-testid="proposal-hourly-rate-field"
                />
                <div>
                  <Button variant="tertiary" size="small" aria-label="Remove Test Developer Two from resource 2">Remove</Button>
                </div>
              </li>
            </ul>
            <div style={row}>
              <Select label="Team member to add to resource 2" items={members} />
              <Button variant="secondary" aria-label="Add team member to resource 2" data-testid="proposal-add-team-member">
                Add team member
              </Button>
            </div>
          </fieldset>
        </section>
        <section aria-labelledby="form-cost" style={panel}>
          <Heading level={2} id="form-cost">Cost</Heading>
          <Text elementType="p">
            Each hourly rate is applied at its resource's target allocation across the contract, from November 2, 2026 to
            October 29, 2027. The total must not be more than the opportunity's maximum budget.
          </Text>
          <div role="status">
            <Text elementType="p">Estimated cost over the contract: $412,500 of the $900,000 maximum budget.</Text>
          </div>
        </section>
        <section aria-labelledby="form-questions" style={panel}>
          <Heading level={2} id="form-questions">Resource questions</Heading>
          <fieldset style={group}>
            <legend style={legend}>Question 1</legend>
            <Text elementType="p">Describe your experience building data pipelines for health data.</Text>
            <TextArea
              id="proposal-question-1"
              label="Response to question 1"
              isRequired
              description="Up to 300 words."
              defaultValue="Our team has built and run the ingestion pipelines for two provincial registries."
              data-testid="proposal-question-response-field"
            />
            <div role="status">
              <Text elementType="p" size="small" color="secondary">13 of 300 words</Text>
            </div>
          </fieldset>
        </section>
        <section aria-labelledby="form-attachments" style={panel}>
          <Heading level={2} id="form-attachments">Attachments</Heading>
          <Text elementType="p">
            Anyone who can read this proposal can read its attachments. Attachments are checked even when you save a draft.
          </Text>
          <Text elementType="p">No attachments have been added.</Text>
          <div id="attachment-size-limit" data-testid="attachment-size-limit">
            <Text elementType="p" size="small" color="secondary">Any type of file, up to 10 MB each.</Text>
          </div>
          <div>
            <FileTrigger>
              <Button variant="secondary" aria-describedby="attachment-size-limit" data-testid="attachment-add-button">
                Add attachment
              </Button>
            </FileTrigger>
          </div>
        </section>
        <Text elementType="p">
          You will be asked to accept the terms and conditions when you submit. You can withdraw a submitted proposal at any
          time.
        </Text>
        <ButtonGroup ariaLabel="Proposal actions">
          <Button variant="tertiary" data-testid="proposal-cancel">Cancel</Button>
          <Button variant="secondary" data-testid="proposal-save-draft">Save draft</Button>
          <Button type="submit" variant="primary" data-testid="proposal-submit">Submit proposal</Button>
        </ButtonGroup>
      </Form>
    </div>
  ),
};
