import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import { Button, ButtonGroup, Form, Heading, Link, Select, Text, TextField } from "@bcgov/design-system-react-components";

// proposal-swu-edit · editing — Edit was pressed on a draft. The Proposal tab becomes the create page's form, filled in,
// with the attachments already stored. The organization can still be changed because the proposal has not been
// submitted. An invalid save is shown exactly as in proposal-swu-create · invalid (R-2.12, R-2.19, R-2.22)
const meta: Meta = { title: "proposals/proposal-swu-edit/editing" };
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
const base = "/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000211";

// Illustrative only: the organizations the signed-in vendor owns or administers.
const organizations = [
  { id: "org-1", label: "Example Digital Ltd." },
  { id: "org-2", label: "Sample Software Co-op" },
];

export const Editing: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a Sprint With Us proposal</Text>
      <Heading level={1}>Modernize the licence renewal service</Heading>
      <Text elementType="p">Status: <span style={badge} data-testid="proposal-status">Draft</span></Text>
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
          <section aria-labelledby="form-organization" style={panel}>
            <Heading level={3} id="form-organization">Organization</Heading>
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
          <Text elementType="p" size="small" color="secondary">
            The Team, Capabilities, Cost, Team questions and References parts follow, filled in, exactly as in
            proposal-swu-create · default. They are trimmed here.
          </Text>
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
                  value="Delivery approach.pdf"
                  isReadOnly
                  description="Already stored, so its name cannot be changed."
                  data-testid="attachment-existing-name"
                />
                <div style={row}>
                  <Link href="/api/files/5b2e0c3a-8d41-4f6e-a1c2-000000000911?type=blob" data-testid="attachment-download-link">
                    Download Delivery approach.pdf
                  </Link>
                  <Button variant="secondary" size="small" aria-label="Remove Delivery approach.pdf" data-testid="attachment-remove-button">
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
