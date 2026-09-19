import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Form, Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";

// proposal-cwu-create · refused — the service refused to create the proposal because this vendor already holds one for
// the opportunity. The alert points at the existing proposal. "This opportunity is no longer accepting proposals."
// (R-2.15) and "Please select a different organization." (R-2.11) are shown in the same places the Sprint With Us and
// Team With Us refused stories show them (R-2.2, R-2.11, R-2.15)
const meta: Meta = { title: "proposals/proposal-cwu-create/refused" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;

export const Refused: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Create a Code With Us proposal</Heading>
      <Text elementType="p" size="small" color="secondary">
        The opportunity summary and the form keep everything the vendor entered. They are as in the default story and are
        trimmed here.
      </Text>
      <div tabIndex={-1} data-testid="proposal-refused-message">
        <InlineAlert variant="danger" title="Your proposal was not created" role="alert">
          <Text elementType="p">You already have a proposal for this opportunity.</Text>
          <Link href="/opportunities/code-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000101/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000111/edit">
            Open your proposal
          </Link>
        </InlineAlert>
      </div>
      <Form validationBehavior="aria" style={stack}>
        <ButtonGroup ariaLabel="Proposal actions">
          <Button variant="tertiary" data-testid="proposal-cancel">Cancel</Button>
          <Button variant="secondary" data-testid="proposal-save-draft">Save draft</Button>
          <Button type="submit" variant="primary" data-testid="proposal-submit">Submit proposal</Button>
        </ButtonGroup>
      </Form>
    </div>
  ),
};
