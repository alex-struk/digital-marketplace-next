import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, ButtonGroup, Heading, Modal, Text } from "@bcgov/design-system-react-components";

// content-edit · delete-confirm — the administrator pressed Delete page on an ordinary page. This one question is the only
// safeguard: removal is immediate and permanent, takes every version with it, and the address stops answering (R-7.9).
const meta: Meta = { title: "content/content-edit/delete-confirm" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;

export const DeleteConfirm: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a page</Text>
      <Heading level={1}>Hackathon rules</Heading>
      <ButtonGroup ariaLabel="Page actions">
        <Button variant="primary" data-testid="content-edit-button">Edit page</Button>
        <Button variant="secondary" danger data-testid="content-delete-button">Delete page</Button>
      </ButtonGroup>
      <Modal isOpen isDismissable>
        <AlertDialog
          variant="destructive"
          title="Delete “Hackathon rules”?"
          data-testid="content-delete-dialog"
          buttons={
            <>
              <Button variant="secondary" data-testid="content-dialog-cancel">Cancel</Button>
              <Button variant="primary" danger data-testid="content-delete-confirm">Delete page</Button>
            </>
          }
        >
          <Text elementType="p">
            The page and every earlier version of it will be removed permanently, and /content/hackathon-rules will stop
            answering. Links to it from anywhere will lead to the not-found page. This cannot be undone.
          </Text>
        </AlertDialog>
      </Modal>
    </div>
  ),
};
