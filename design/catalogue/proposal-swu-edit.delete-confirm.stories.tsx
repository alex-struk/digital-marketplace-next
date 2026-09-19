import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, ButtonGroup, Heading, Modal, Text } from "@bcgov/design-system-react-components";

// proposal-swu-edit · delete-confirm — the vendor asked to delete their draft. Deleting is permanent, and afterwards
// the proposal can no longer be opened. Delete is offered only on a draft (R-2.4)
const meta: Meta = { title: "proposals/proposal-swu-edit/delete-confirm" };
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
      <Text elementType="p" size="small" color="secondary">Manage a Sprint With Us proposal</Text>
      <Heading level={1}>Modernize the licence renewal service</Heading>
      <Text elementType="p">Status: <span style={badge} data-testid="proposal-status">Draft</span></Text>
      <div data-testid="proposal-actions">
        <ButtonGroup ariaLabel="Proposal actions">
          <Button variant="secondary" data-testid="proposal-edit-button">Edit</Button>
          <Button variant="primary" data-testid="proposal-submit">Submit proposal</Button>
          <Button variant="secondary" danger data-testid="proposal-delete-button">Delete</Button>
        </ButtonGroup>
      </div>
      <Text elementType="p" size="small" color="secondary">The rest of the page is as in the draft story and is trimmed here.</Text>
      <Modal isOpen isDismissable>
        <AlertDialog
          variant="destructive"
          title="Delete this proposal?"
          data-testid="proposal-delete-dialog"
          buttons={
            <>
              <Button variant="secondary" data-testid="proposal-dialog-cancel">Cancel</Button>
              <Button variant="primary" danger data-testid="proposal-delete-confirm">Delete proposal</Button>
            </>
          }
        >
          <Text elementType="p">The draft and everything in it will be removed, and it can no longer be opened. This cannot be undone.</Text>
        </AlertDialog>
      </Modal>
    </div>
  ),
};
