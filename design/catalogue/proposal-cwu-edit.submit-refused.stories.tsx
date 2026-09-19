import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, InlineAlert, Text } from "@bcgov/design-system-react-components";

// proposal-cwu-edit · submit-refused — a withdrawn proposal the vendor tried to submit again after the deadline. The
// service refuses it and it stays withdrawn. Before the deadline the same page, without the alert, lets it go back in.
// Submitting a draft after the deadline is refused the same way (R-2.15, R-2.23)
const meta: Meta = { title: "proposals/proposal-cwu-edit/submit-refused" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

export const SubmitRefused: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a Code With Us proposal</Text>
      <Heading level={1}>Build an accessible permit tracker</Heading>
      <Text elementType="p">Status: <span style={badge} data-testid="proposal-status">Withdrawn</span></Text>
      <div data-testid="proposal-actions">
        <ButtonGroup ariaLabel="Proposal actions">
          <Button variant="secondary" data-testid="proposal-edit-button">Edit</Button>
          <Button variant="primary" data-testid="proposal-submit">Submit proposal</Button>
        </ButtonGroup>
      </div>
      <div tabIndex={-1} data-testid="proposal-submit-refused-message">
        <InlineAlert variant="danger" title="Your proposal was not submitted" role="alert">
          <Text elementType="p">This opportunity is no longer accepting proposals.</Text>
        </InlineAlert>
      </div>
      <Text elementType="p" size="small" color="secondary">The rest of the page is as in the default story and is trimmed here.</Text>
    </div>
  ),
};
