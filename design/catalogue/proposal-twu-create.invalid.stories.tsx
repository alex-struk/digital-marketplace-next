import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  ButtonGroup,
  Form,
  Heading,
  InlineAlert,
  Link,
  NumberField,
  Select,
  Text,
  TextArea,
} from "@bcgov/design-system-react-components";

// proposal-twu-create · invalid — submitted with problems: an organization that does not provide a service area the
// opportunity needs, an hourly rate below $1, the same person named twice, and an empty response. A proposal with no
// team members is refused with "Name at least one team member." in the Team section's place (R-2.17, R-2.18, R-2.20,
// R-2.21)
const meta: Meta = { title: "proposals/proposal-twu-create/invalid" };
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

export const Invalid: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Create a Team With Us proposal</Heading>
      <Text elementType="p">A draft can be saved with any field blank. Every required field is needed to submit.</Text>
      <div tabIndex={-1}>
        <InlineAlert variant="danger" title="This proposal has 4 problems" role="alert">
          <ul>
            <li data-testid="field-error"><Link href="#proposal-organization">Organization: the selected organization does not satisfy this opportunity's service areas</Link></li>
            <li data-testid="field-error"><Link href="#proposal-resource-1-rate-one">Resource 1: enter an hourly rate of at least $1</Link></li>
            <li data-testid="field-error"><Link href="#proposal-resource-2-rate-one">Resource 2: Please select unique team members.</Link></li>
            <li data-testid="field-error"><Link href="#proposal-question-1">Question 1: enter a response</Link></li>
          </ul>
        </InlineAlert>
      </div>
      <Text elementType="p" size="small" color="secondary">
        The opportunity summary, the cost and the attachments are as in the default story and are trimmed here.
      </Text>
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
            isInvalid
            errorMessage="The selected organization does not satisfy this opportunity's service areas."
            data-testid="proposal-organization-field"
          />
          <div id="proposal-service-area-message" data-testid="proposal-service-area-error">
            <Text elementType="p" color="danger">Example Digital Ltd. does not provide Data professional, which resource 2 needs.</Text>
          </div>
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
                  defaultValue={0}
                  isInvalid
                  errorMessage="Enter an hourly rate of at least $1"
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
              <li style={item}>
                <Text elementType="p">Test Developer One</Text>
                <Text elementType="p" color="danger">Please select unique team members.</Text>
                <NumberField
                  id="proposal-resource-2-rate-one"
                  label="Hourly rate for Test Developer One"
                  isRequired
                  description="At least $1."
                  formatOptions={rate}
                  defaultValue={140}
                  data-testid="proposal-hourly-rate-field"
                />
                <div>
                  <Button variant="tertiary" size="small" aria-label="Remove Test Developer One from resource 2">Remove</Button>
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
              defaultValue=""
              isInvalid
              errorMessage="Enter a response to question 1"
              data-testid="proposal-question-response-field"
            />
            <div role="status">
              <Text elementType="p" size="small" color="secondary">0 of 300 words</Text>
            </div>
          </fieldset>
        </section>
        <ButtonGroup ariaLabel="Proposal actions">
          <Button variant="tertiary" data-testid="proposal-cancel">Cancel</Button>
          <Button variant="secondary" data-testid="proposal-save-draft">Save draft</Button>
          <Button type="submit" variant="primary" data-testid="proposal-submit">Submit proposal</Button>
        </ButtonGroup>
      </Form>
    </div>
  ),
};
