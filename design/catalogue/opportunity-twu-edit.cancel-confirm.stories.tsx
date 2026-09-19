import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, ButtonGroup, Heading, Modal, Text, TextArea } from "@bcgov/design-system-react-components";

// opportunity-twu-edit · cancel-confirm — an administrator asked to confirm cancelling an opportunity in evaluation,
// with an optional note (R-1.28, R-1.36)
const meta: Meta = { title: "opportunities/opportunity-twu-edit/cancel-confirm" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const dialogBody = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

export const CancelConfirm: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a Team With Us opportunity</Text>
      <Heading level={1}>Data platform team</Heading>
      <Text elementType="p">Status: <span style={badge} data-testid="opportunity-status">Resource questions: individual evaluation</span></Text>
      <ButtonGroup ariaLabel="Opportunity actions">
        <Button variant="secondary" data-testid="opportunity-edit-button">Edit</Button>
        <Button variant="secondary" danger data-testid="opportunity-cancel-button">Cancel opportunity</Button>
      </ButtonGroup>
      <Modal isOpen isDismissable>
        <AlertDialog
          variant="destructive"
          title="Cancel this opportunity?"
          data-testid="opportunity-cancel-dialog"
          buttons={
            <>
              <Button variant="secondary" data-testid="opportunity-dialog-cancel">Keep opportunity</Button>
              <Button variant="primary" danger data-testid="opportunity-cancel-confirm">Cancel opportunity</Button>
            </>
          }
        >
          <div style={dialogBody}>
            <Text elementType="p">
              It will stop accepting proposals, and this cannot be undone. Everyone watching it and everyone who has submitted
              a proposal will be told it has been cancelled, and its author will be told separately.
            </Text>
            <TextArea label="Note (optional)" maxLength={1000} description="Up to 1,000 characters." data-testid="opportunity-cancel-note-field" />
          </div>
        </AlertDialog>
      </Modal>
    </div>
  ),
};
