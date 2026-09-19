import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, InlineAlert, Text } from "@bcgov/design-system-react-components";

// proposal-twu-edit · submit-refused — a withdrawn proposal the vendor tried to submit again after the deadline. The
// service refuses it and it stays withdrawn. A submission refused because the organization is not qualified or lacks a
// service area appears in the same place (R-2.15, R-2.17, R-2.23)
const meta: Meta = { title: "proposals/proposal-twu-edit/submit-refused" };
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
      <Text elementType="p" size="small" color="secondary">Manage a Team With Us proposal</Text>
      <Heading level={1}>Data platform team</Heading>
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
