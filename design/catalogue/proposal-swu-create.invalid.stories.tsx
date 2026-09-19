import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  ButtonGroup,
  Checkbox,
  Form,
  Heading,
  InlineAlert,
  Link,
  NumberField,
  Select,
  Text,
  TextArea,
} from "@bcgov/design-system-react-components";

// proposal-swu-create · invalid — submitted with problems: a team member who is not an active member (shown as
// pending), two scrum masters in one phase, a phase over its budget, a capability no one covers, a total over the
// opportunity's budget, and a response over its word limit. Each is named where it happens and in the summary (R-2.18,
// R-2.19, R-2.21)
const meta: Meta = { title: "proposals/proposal-swu-create/invalid" };
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
const nameRow = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--layout-margin-medium)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const currency = { style: "currency", currency: "CAD", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 } as const;

// Illustrative only: the chosen organization's members.
const members = [
  { id: "u-v-1", label: "Test Vendor" },
  { id: "u-v-2", label: "Test Developer One" },
  { id: "u-v-3", label: "Test Developer Two" },
  { id: "u-v-4", label: "Test Designer" },
];

export const Invalid: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Create a Sprint With Us proposal</Heading>
      <Text elementType="p">A draft can be saved with any field blank. Every required field is needed to submit.</Text>
      <div tabIndex={-1}>
        <InlineAlert variant="danger" title="This proposal has 6 problems" role="alert">
          <ul>
            <li data-testid="field-error"><Link href="#proposal-prototype-team">Prototype phase: Test Developer Two is not an active member of the organization</Link></li>
            <li data-testid="field-error"><Link href="#proposal-implementation-scrum-error">Implementation phase: name no more than one scrum master</Link></li>
            <li data-testid="field-error"><Link href="#proposal-implementation-cost">Implementation phase: the proposed cost is more than the phase maximum of $850,000</Link></li>
            <li data-testid="field-error"><Link href="#proposal-capabilities-error">Capabilities: no one on your teams covers Security engineering</Link></li>
            <li data-testid="field-error"><Link href="#proposal-cost-error">Cost: the total proposed cost is more than the maximum budget of $1,200,000</Link></li>
            <li data-testid="field-error"><Link href="#proposal-question-2">Question 2: the response is longer than 500 words</Link></li>
          </ul>
        </InlineAlert>
      </div>
      <Text elementType="p" size="small" color="secondary">
        The opportunity summary, the organization, references and attachments are as in the default story and are trimmed
        here.
      </Text>
      <Form validationBehavior="aria" style={stack}>
        <section aria-labelledby="form-team" style={panel}>
          <Heading level={2} id="form-team">Team</Heading>
          <Text elementType="p">
            Name a team for each phase this opportunity has, and at most one scrum master in each. Everyone you name must be an
            active member of the organization.
          </Text>
          <fieldset id="proposal-prototype-team" style={group}>
            <legend style={legend}>Prototype phase</legend>
            <Text elementType="p" size="small" color="secondary">November 2, 2026 to January 29, 2027. Maximum budget $400,000.</Text>
            <ul style={list}>
              <li style={item}>
                <Text elementType="p">Test Vendor</Text>
                <Checkbox defaultSelected aria-label="Scrum master: Test Vendor, prototype phase" data-testid="proposal-scrum-master">Scrum master</Checkbox>
                <div>
                  <Button variant="tertiary" size="small" aria-label="Remove Test Vendor from the prototype phase">Remove</Button>
                </div>
              </li>
              <li style={item}>
                <div style={nameRow}>
                  <Text elementType="p">Test Developer Two</Text>
                  <span style={badge} data-testid="proposal-pending-team-member">Membership pending</span>
                </div>
                <Text elementType="p" color="danger">User is not an active member of the organization.</Text>
                <Checkbox aria-label="Scrum master: Test Developer Two, prototype phase" data-testid="proposal-scrum-master">Scrum master</Checkbox>
                <div>
                  <Button variant="tertiary" size="small" aria-label="Remove Test Developer Two from the prototype phase">Remove</Button>
                </div>
              </li>
            </ul>
            <div style={row}>
              <Select label="Team member to add to the prototype phase" items={members} />
              <Button variant="secondary" aria-label="Add team member to the prototype phase" data-testid="proposal-add-team-member">
                Add team member
              </Button>
            </div>
            <NumberField
              id="proposal-prototype-cost"
              label="Proposed cost for the prototype phase"
              isRequired
              description="Up to the phase's maximum budget of $400,000."
              formatOptions={currency}
              defaultValue={300000}
              data-testid="proposal-phase-cost-field"
            />
          </fieldset>
          <fieldset id="proposal-implementation-team" style={group} aria-describedby="proposal-implementation-scrum-error">
            <legend style={legend}>Implementation phase</legend>
            <Text elementType="p" size="small" color="secondary">February 1, 2027 to September 30, 2027. Maximum budget $850,000.</Text>
            <ul style={list}>
              <li style={item}>
                <Text elementType="p">Test Vendor</Text>
                <Checkbox defaultSelected aria-label="Scrum master: Test Vendor, implementation phase" data-testid="proposal-scrum-master">Scrum master</Checkbox>
                <div>
                  <Button variant="tertiary" size="small" aria-label="Remove Test Vendor from the implementation phase">Remove</Button>
                </div>
              </li>
              <li style={item}>
                <Text elementType="p">Test Developer One</Text>
                <Checkbox defaultSelected aria-label="Scrum master: Test Developer One, implementation phase" data-testid="proposal-scrum-master">Scrum master</Checkbox>
                <div>
                  <Button variant="tertiary" size="small" aria-label="Remove Test Developer One from the implementation phase">Remove</Button>
                </div>
              </li>
            </ul>
            <div id="proposal-implementation-scrum-error">
              <Text elementType="p" color="danger">Name no more than one scrum master in the implementation phase.</Text>
            </div>
            <div style={row}>
              <Select label="Team member to add to the implementation phase" items={members} />
              <Button variant="secondary" aria-label="Add team member to the implementation phase" data-testid="proposal-add-team-member">
                Add team member
              </Button>
            </div>
            <NumberField
              id="proposal-implementation-cost"
              label="Proposed cost for the implementation phase"
              isRequired
              description="Up to the phase's maximum budget of $850,000."
              formatOptions={currency}
              defaultValue={1000000}
              isInvalid
              errorMessage="Enter a cost of no more than $850,000 for the implementation phase"
              data-testid="proposal-phase-cost-field"
            />
          </fieldset>
        </section>
        <section aria-labelledby="form-capabilities" style={panel}>
          <Heading level={2} id="form-capabilities">Capabilities</Heading>
          <Text elementType="p">Between them, your phase teams must cover every capability this opportunity requires.</Text>
          <ul>
            <li>Agile coaching: covered</li>
            <li>Backend development: covered</li>
            <li>Frontend development: covered</li>
            <li>User research: covered</li>
            <li>Security engineering: not covered</li>
          </ul>
          <div id="proposal-capabilities-error" data-testid="proposal-capability-gap-error">
            <Text elementType="p" color="danger">No one on your teams covers Security engineering. Add a team member who does.</Text>
          </div>
        </section>
        <section aria-labelledby="form-cost" style={panel}>
          <Heading level={2} id="form-cost">Cost</Heading>
          <div role="status">
            <Text elementType="p">Total proposed cost: $1,300,000 of the $1,200,000 maximum budget.</Text>
          </div>
          <div id="proposal-cost-error" data-testid="proposal-budget-exceeded-error">
            <Text elementType="p" color="danger">
              The total proposed cost of $1,300,000 is more than the opportunity's maximum budget of $1,200,000.
            </Text>
          </div>
        </section>
        <section aria-labelledby="form-questions" style={panel}>
          <Heading level={2} id="form-questions">Team questions</Heading>
          <fieldset style={group}>
            <legend style={legend}>Question 1</legend>
            <Text elementType="p">Describe how your team would approach user research for the renewal service.</Text>
            <TextArea
              id="proposal-question-1"
              label="Response to question 1"
              isRequired
              description="Up to 300 words."
              defaultValue="We would start with the renewal staff and the ten most common reasons a renewal is returned."
              data-testid="proposal-question-response-field"
            />
            <div role="status">
              <Text elementType="p" size="small" color="secondary">18 of 300 words</Text>
            </div>
          </fieldset>
          <fieldset style={group}>
            <legend style={legend}>Question 2</legend>
            <Text elementType="p">Describe a time your team replaced a legacy system without interrupting service.</Text>
            <TextArea
              id="proposal-question-2"
              label="Response to question 2"
              isRequired
              description="Up to 500 words."
              defaultValue="We moved a permit service to a new platform in stages, running both side by side for six weeks. (The rest of this illustrative 612-word response is not shown.)"
              isInvalid
              errorMessage="Shorten the response to 500 words or fewer. It is 612 words."
              data-testid="proposal-question-response-field"
            />
            <div role="status">
              <Text elementType="p" size="small" color="secondary">612 of 500 words</Text>
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
