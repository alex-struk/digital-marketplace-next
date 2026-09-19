import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, ButtonGroup, Heading, Modal, Text } from "@bcgov/design-system-react-components";

// opportunity-swu-edit · delete-confirm — the author asked to confirm deleting their draft (R-1.28, R-1.53)
const meta: Meta = { title: "opportunities/opportunity-swu-edit/delete-confirm" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

export const DeleteConfirm: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a Sprint With Us opportunity</Text>
      <Heading level={1}>Modernize the licence renewal service</Heading>
      <Text elementType="p">Status: <span style={badge} data-testid="opportunity-status">Draft</span></Text>
      <ButtonGroup ariaLabel="Opportunity actions">
        <Button variant="secondary" data-testid="opportunity-edit-button">Edit</Button>
        <Button variant="primary" data-testid="opportunity-submit-for-review">Submit for review</Button>
        <Button variant="secondary" danger data-testid="opportunity-delete-button">Delete</Button>
      </ButtonGroup>
      <Modal isOpen isDismissable>
        <AlertDialog
          variant="destructive"
          title="Delete this opportunity?"
          data-testid="opportunity-delete-dialog"
          buttons={
            <>
              <Button variant="secondary" data-testid="opportunity-dialog-cancel">Cancel</Button>
              <Button variant="primary" danger data-testid="opportunity-delete-confirm">Delete opportunity</Button>
            </>
          }
        >
          <Text elementType="p">The opportunity and everything entered in it will be removed. This cannot be undone.</Text>
        </AlertDialog>
      </Modal>
    </div>
  ),
};
