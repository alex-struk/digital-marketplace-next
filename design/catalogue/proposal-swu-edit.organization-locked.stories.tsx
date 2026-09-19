import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Form, Heading, InlineAlert, Link, Select, Text } from "@bcgov/design-system-react-components";

// proposal-swu-edit · organization-locked — a submitted proposal was edited to name a different organization, and the
// save was refused. The field's description said so beforehand; the refusal is its error. On a draft or a withdrawn
// proposal the same change is accepted (R-2.22)
const meta: Meta = { title: "proposals/proposal-swu-edit/organization-locked" };
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
const base = "/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000211";

// Illustrative only: the organizations the signed-in vendor owns or administers.
const organizations = [
  { id: "org-1", label: "Example Digital Ltd." },
  { id: "org-2", label: "Sample Software Co-op" },
];

export const OrganizationLocked: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a Sprint With Us proposal</Text>
      <Heading level={1}>Modernize the licence renewal service</Heading>
      <Text elementType="p">Status: <span style={badge} data-testid="proposal-status">Submitted</span></Text>
      <nav aria-label="Proposal sections">
        <ul style={tabs}>
          <li><Link href={`${base}/edit?tab=proposal`} aria-current="page" data-testid="proposal-tab-proposal">Proposal</Link></li>
          <li><Link href={`${base}/edit?tab=history`} data-testid="proposal-tab-history">History</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Proposal</Heading>
        <div tabIndex={-1}>
          <InlineAlert variant="danger" title="Your changes have 1 problem" role="alert">
            <ul>
              <li data-testid="field-error">
                <Link href="#proposal-organization">Organization: Organization cannot be changed once the proposal has been submitted</Link>
              </li>
            </ul>
          </InlineAlert>
        </div>
        <Form validationBehavior="aria" style={stack}>
          <section aria-labelledby="form-organization" style={panel}>
            <Heading level={3} id="form-organization">Organization</Heading>
            <Select
              id="proposal-organization"
              label="Organization"
              isRequired
              description="It cannot be changed while the proposal is submitted. Withdraw the proposal first to change it."
              items={organizations}
              defaultValue="org-2"
              isInvalid
              errorMessage="Organization cannot be changed once the proposal has been submitted"
              data-testid="proposal-organization-field"
            />
          </section>
          <Text elementType="p" size="small" color="secondary">
            The rest of the form keeps what the vendor entered, as in the editing story. It is trimmed here.
          </Text>
          <ButtonGroup ariaLabel="Save choices">
            <Button variant="tertiary" data-testid="proposal-cancel-edit">Cancel</Button>
            <Button type="submit" variant="primary" data-testid="proposal-save-changes">Save changes</Button>
          </ButtonGroup>
        </Form>
      </section>
    </div>
  ),
};
