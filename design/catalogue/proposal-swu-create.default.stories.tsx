import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import {
  Button,
  ButtonGroup,
  Checkbox,
  Form,
  Heading,
  Link,
  NumberField,
  Select,
  Text,
  TextArea,
  TextField,
} from "@bcgov/design-system-react-components";

// proposal-swu-create · default — a vendor bids for an organization they own or administer. There is one team for
// each phase the opportunity has and no other, each member can be marked scrum master, the capabilities and the total
// cost are shown as they change, and each team question has its word limit stated (R-2.1, R-2.12, R-2.16, R-2.18,
// R-2.19, R-2.21)
const meta: Meta = { title: "proposals/proposal-swu-create/default" };
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
const currency = { style: "currency", currency: "CAD", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 } as const;

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
      <Heading level={1}>Create a Sprint With Us proposal</Heading>
      <section aria-labelledby="create-opportunity" style={panel} data-testid="proposal-opportunity-summary">
        <Heading level={2} id="create-opportunity">The opportunity</Heading>
        <dl style={facts}>
          <div style={fact}>
            <dt style={term}>Opportunity</dt>
            <dd style={detail}><Link href="/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201">Modernize the licence renewal service</Link></dd>
          </div>
          <div style={fact}>
            <dt style={term}>Maximum budget</dt>
            <dd style={detail}>$1,200,000</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Proposal deadline</dt>
            <dd style={detail}>October 16, 2026 at 4:00 p.m. Pacific time</dd>
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
            description="Organizations you own or administer. It must be a qualified supplier for Sprint With Us before you submit."
            items={organizations}
            defaultValue="org-1"
            data-testid="proposal-organization-field"
          />
        </section>
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
                <Text elementType="p">Test Developer One</Text>
                <Checkbox aria-label="Scrum master: Test Developer One, prototype phase" data-testid="proposal-scrum-master">Scrum master</Checkbox>
                <div>
                  <Button variant="tertiary" size="small" aria-label="Remove Test Developer One from the prototype phase">Remove</Button>
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
          <fieldset id="proposal-implementation-team" style={group}>
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
                <Checkbox aria-label="Scrum master: Test Developer One, implementation phase" data-testid="proposal-scrum-master">Scrum master</Checkbox>
                <div>
                  <Button variant="tertiary" size="small" aria-label="Remove Test Developer One from the implementation phase">Remove</Button>
                </div>
              </li>
              <li style={item}>
                <Text elementType="p">Test Designer</Text>
                <Checkbox aria-label="Scrum master: Test Designer, implementation phase" data-testid="proposal-scrum-master">Scrum master</Checkbox>
                <div>
                  <Button variant="tertiary" size="small" aria-label="Remove Test Designer from the implementation phase">Remove</Button>
                </div>
              </li>
            </ul>
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
              defaultValue={850000}
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
            <li>Security engineering: covered</li>
          </ul>
        </section>
        <section aria-labelledby="form-cost" style={panel}>
          <Heading level={2} id="form-cost">Cost</Heading>
          <div role="status">
            <Text elementType="p">Total proposed cost: $1,150,000 of the $1,200,000 maximum budget.</Text>
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
              defaultValue="We moved a permit service to a new platform in stages."
              data-testid="proposal-question-response-field"
            />
            <div role="status">
              <Text elementType="p" size="small" color="secondary">10 of 500 words</Text>
            </div>
          </fieldset>
        </section>
        <section aria-labelledby="form-references" style={panel}>
          <Heading level={2} id="form-references">References</Heading>
          <fieldset style={group}>
            <legend style={legend}>Reference 1</legend>
            <TextField label="Name" defaultValue="Test Reference One" />
            <TextField label="Email address" type="email" defaultValue="test.reference@example.com" />
            <TextField label="Phone number (optional)" type="tel" />
            <div>
              <Button variant="tertiary" size="small">Remove reference 1</Button>
            </div>
          </fieldset>
          <div>
            <Button variant="secondary" data-testid="proposal-add-reference">Add a reference</Button>
          </div>
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
