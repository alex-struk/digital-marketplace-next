import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, ButtonGroup, Heading, Modal, Text } from "@bcgov/design-system-react-components";

// opportunity-swu-edit · publish-confirm — an administrator who pressed Publish on an opportunity under review is asked
// to confirm (R-1.22, R-1.23, R-1.34, R-5.17)
const meta: Meta = { title: "opportunities/opportunity-swu-edit/publish-confirm" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

export const PublishConfirm: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a Sprint With Us opportunity</Text>
      <Heading level={1}>Modernize the licence renewal service</Heading>
      <Text elementType="p">Status: <span style={badge} data-testid="opportunity-status">Under review</span></Text>
      <ButtonGroup ariaLabel="Opportunity actions">
        <Button variant="secondary" data-testid="opportunity-edit-button">Edit</Button>
        <Button variant="primary" data-testid="opportunity-publish">Publish</Button>
        <Button variant="secondary" danger data-testid="opportunity-delete-button">Delete</Button>
      </ButtonGroup>
      <Modal isOpen isDismissable>
        <AlertDialog
          variant="confirmation"
          title="Publish this opportunity?"
          data-testid="opportunity-publish-dialog"
          buttons={
            <>
              <Button variant="secondary" data-testid="opportunity-dialog-cancel">Cancel</Button>
              <Button variant="primary" data-testid="opportunity-publish-confirm">Publish opportunity</Button>
            </>
          }
        >
          <Text elementType="p">
            Everyone will be able to read it and send proposals until its proposal deadline. Everyone who has asked to hear
            about new opportunities will be emailed, and its author will be sent a confirmation. The evaluation panel will be
            told they are on it.
          </Text>
        </AlertDialog>
      </Modal>
    </div>
  ),
};
