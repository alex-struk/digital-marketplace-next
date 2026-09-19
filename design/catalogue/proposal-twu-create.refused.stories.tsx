import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Form, Heading, InlineAlert, Link, Select, Text } from "@bcgov/design-system-react-components";

// proposal-twu-create · refused — the service refused the proposal because another proposal for this opportunity
// already names the organization. The refusal is the organization field's own error, with a link to the existing
// proposal (R-2.2, R-2.11)
const meta: Meta = { title: "proposals/proposal-twu-create/refused" };
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

// Illustrative only: the organizations the signed-in vendor owns or administers.
const organizations = [
  { id: "org-1", label: "Example Digital Ltd." },
  { id: "org-2", label: "Sample Software Co-op" },
];

export const Refused: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Create a Team With Us proposal</Heading>
      <Text elementType="p">A draft can be saved with any field blank. Every required field is needed to submit.</Text>
      <div tabIndex={-1}>
        <InlineAlert variant="danger" title="This proposal has 1 problem" role="alert">
          <ul>
            <li data-testid="field-error"><Link href="#proposal-organization">Organization: Please select a different organization.</Link></li>
          </ul>
        </InlineAlert>
      </div>
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
            errorMessage="Please select a different organization."
            data-testid="proposal-organization-field"
          />
          <Text elementType="p" size="small">
            Example Digital Ltd. already has a proposal for this opportunity.{" "}
            <Link href="/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000399/edit">
              Open the existing proposal
            </Link>
          </Text>
        </section>
        <Text elementType="p" size="small" color="secondary">
          The opportunity summary and the rest of the form keep what the vendor entered. They are as in the default story and
          are trimmed here.
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
