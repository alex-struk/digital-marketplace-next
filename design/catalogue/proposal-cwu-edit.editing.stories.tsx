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
  Text,
  TextArea,
  TextField,
} from "@bcgov/design-system-react-components";

// proposal-cwu-edit · editing — Edit was pressed on a draft. The Proposal tab becomes the create page's form, filled
// in, with the attachments already stored: each can be downloaded or removed, and more can be added. An invalid save is
// shown exactly as in proposal-cwu-create · invalid (R-2.12, R-2.13, R-2.14)
const meta: Meta = { title: "proposals/proposal-cwu-edit/editing" };
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
const facts = { display: "flex", flexWrap: "wrap", gap: "var(--layout-margin-large)", margin: "var(--layout-margin-none)" } as const;
const fact = { display: "grid", gap: "var(--layout-margin-xsmall)" } as const;
const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { margin: "var(--layout-margin-none)" } as const;
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
const base = "/opportunities/code-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000101/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000111";

export const Editing: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a Code With Us proposal</Text>
      <Heading level={1}>Build an accessible permit tracker</Heading>
      <dl style={facts}>
        <div style={fact}>
          <dt style={term}>Status</dt>
          <dd style={detail}><span style={badge} data-testid="proposal-status">Draft</span></dd>
        </div>
        <div style={fact}>
          <dt style={term}>Proposal ID</dt>
          <dd style={detail} data-testid="proposal-identifier">3f8a2c10-6d4b-4e19-a7c5-000000000111</dd>
        </div>
        <div style={fact}>
          <dt style={term}>Opportunity ID</dt>
          <dd style={detail} data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000101</dd>
        </div>
      </dl>
      <nav aria-label="Proposal sections">
        <ul style={tabs}>
          <li><Link href={`${base}/edit?tab=proposal`} aria-current="page" data-testid="proposal-tab-proposal">Proposal</Link></li>
          <li><Link href={`${base}/edit?tab=history`} data-testid="proposal-tab-history">History</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Proposal</Heading>
        <Text elementType="p">A draft can be saved with any field blank. Every required field is needed to submit.</Text>
        <Form validationBehavior="aria" style={stack}>
          <section aria-labelledby="form-proponent" style={panel}>
            <Heading level={3} id="form-proponent">Proponent</Heading>
            <RadioGroup id="proposal-proponent-type" label="Who is submitting this proposal?" isRequired defaultValue="individual">
              <Radio value="individual" data-testid="proposal-proponent-individual">An individual</Radio>
              <Radio value="organization" data-testid="proposal-proponent-organization">An organization</Radio>
            </RadioGroup>
            <TextField id="proposal-legal-name" label="Legal name" isRequired defaultValue="Test Vendor" data-testid="proposal-legal-name-field" />
            <TextField id="proposal-email" label="Email address" type="email" isRequired defaultValue="test.vendor@example.com" data-testid="proposal-email-field" />
            <TextField id="proposal-phone" label="Phone number (optional)" type="tel" data-testid="proposal-phone-field" />
            <TextField id="proposal-street" label="Street address" isRequired defaultValue="100 Example Street" data-testid="proposal-street-field" />
            <TextField id="proposal-street-2" label="Street address line 2 (optional)" data-testid="proposal-street-2-field" />
            <TextField id="proposal-city" label="City" isRequired defaultValue="Victoria" data-testid="proposal-city-field" />
            <TextField id="proposal-region" label="Province or state" isRequired defaultValue="BC" data-testid="proposal-region-field" />
            <TextField id="proposal-postal" label="Postal code" isRequired defaultValue="V8W 0A0" data-testid="proposal-postal-field" />
            <TextField id="proposal-country" label="Country" isRequired defaultValue="Canada" data-testid="proposal-country-field" />
          </section>
          <section aria-labelledby="form-proposal" style={panel}>
            <Heading level={3} id="form-proposal">Proposal text</Heading>
            <TextArea
              id="proposal-text"
              label="Proposal"
              isRequired
              maxLength={10000}
              description="Between 1 and 10,000 characters."
              defaultValue="I will add a status page to the permit application that shows each stage in plain language."
              data-testid="proposal-text-field"
            />
            <TextArea
              id="proposal-comments"
              label="Additional comments (optional)"
              maxLength={10000}
              description="Up to 10,000 characters."
              defaultValue="I am available to start on the assignment date."
              data-testid="proposal-comments-field"
            />
          </section>
          <section aria-labelledby="form-attachments" style={panel}>
            <Heading level={3} id="form-attachments">Attachments</Heading>
            <Text elementType="p">
              Anyone who can read this proposal can read its attachments. Attachments are checked even when you save a draft.
              Removing an attachment stops it being readable through this proposal once you save.
            </Text>
            <ul style={list} data-testid="attachment-list">
              <li style={item} data-testid="attachment-existing-row">
                <TextField
                  label="Attachment name"
                  value="Delivery plan.pdf"
                  isReadOnly
                  description="Already stored, so its name cannot be changed."
                  data-testid="attachment-existing-name"
                />
                <div style={row}>
                  <Link href="/api/files/5b2e0c3a-8d41-4f6e-a1c2-000000000901?type=blob" data-testid="attachment-download-link">
                    Download Delivery plan.pdf
                  </Link>
                  <Button variant="secondary" size="small" aria-label="Remove Delivery plan.pdf" data-testid="attachment-remove-button">
                    Remove
                  </Button>
                </div>
              </li>
            </ul>
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
            Save changes keeps this proposal as a draft. Save changes and submit asks you to accept the terms and conditions.
          </Text>
          <ButtonGroup ariaLabel="Save choices">
            <Button variant="tertiary" data-testid="proposal-cancel-edit">Cancel</Button>
            <Button variant="secondary" data-testid="proposal-save-changes">Save changes</Button>
            <Button type="submit" variant="primary" data-testid="proposal-save-and-submit">Save changes and submit</Button>
          </ButtonGroup>
        </Form>
      </section>
    </div>
  ),
};
