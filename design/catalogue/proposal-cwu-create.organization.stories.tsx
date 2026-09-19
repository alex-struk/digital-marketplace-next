import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import {
  Button,
  ButtonGroup,
  Form,
  Heading,
  Link,
  Radio,
  RadioGroup,
  Select,
  Text,
  TextArea,
} from "@bcgov/design-system-react-components";

// proposal-cwu-create · organization — the vendor submits for an organization, so the individual's name and address
// give way to one choice among the organizations they own or administer (R-2.11, R-2.14)
const meta: Meta = { title: "proposals/proposal-cwu-create/organization" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const panel = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const facts = { display: "flex", flexWrap: "wrap", gap: "var(--layout-margin-large)", margin: "var(--layout-margin-none)" } as const;
const fact = { display: "grid", gap: "var(--layout-margin-xsmall)" } as const;
const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { margin: "var(--layout-margin-none)" } as const;

// Illustrative only: the organizations the signed-in vendor owns or administers.
const organizations = [
  { id: "org-1", label: "Example Digital Ltd." },
  { id: "org-2", label: "Sample Software Co-op" },
];

export const Organization: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Create a Code With Us proposal</Heading>
      <section aria-labelledby="create-opportunity" style={panel} data-testid="proposal-opportunity-summary">
        <Heading level={2} id="create-opportunity">The opportunity</Heading>
        <dl style={facts}>
          <div style={fact}>
            <dt style={term}>Opportunity</dt>
            <dd style={detail}><Link href="/opportunities/code-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000101">Build an accessible permit tracker</Link></dd>
          </div>
          <div style={fact}>
            <dt style={term}>Reward</dt>
            <dd style={detail}>$45,000</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Proposal deadline</dt>
            <dd style={detail}>October 2, 2026 at 4:00 p.m. Pacific time</dd>
          </div>
        </dl>
      </section>
      <Text elementType="p">A draft can be saved with any field blank. Every required field is needed to submit.</Text>
      <Form validationBehavior="aria" style={stack}>
        <section aria-labelledby="form-proponent" style={panel}>
          <Heading level={2} id="form-proponent">Proponent</Heading>
          <RadioGroup id="proposal-proponent-type" label="Who is submitting this proposal?" isRequired defaultValue="organization">
            <Radio value="individual" data-testid="proposal-proponent-individual">An individual</Radio>
            <Radio value="organization" data-testid="proposal-proponent-organization">An organization</Radio>
          </RadioGroup>
          <Select
            id="proposal-organization"
            label="Organization"
            isRequired
            description="Organizations you own or administer. An organization can be named on only one proposal for each opportunity."
            items={organizations}
            defaultValue="org-1"
            data-testid="proposal-organization-field"
          />
        </section>
        <section aria-labelledby="form-proposal" style={panel}>
          <Heading level={2} id="form-proposal">Proposal</Heading>
          <TextArea
            id="proposal-text"
            label="Proposal"
            isRequired
            maxLength={10000}
            description="Between 1 and 10,000 characters."
            defaultValue="Our team will add a status page to the permit application that shows each stage in plain language."
            data-testid="proposal-text-field"
          />
          <TextArea
            id="proposal-comments"
            label="Additional comments (optional)"
            maxLength={10000}
            description="Up to 10,000 characters."
            data-testid="proposal-comments-field"
          />
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
