import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, ButtonGroup, Heading, Modal, Text } from "@bcgov/design-system-react-components";

// proposal-twu-edit · withdraw-confirm — the vendor asked to withdraw their submitted proposal. The dialog says until
// when it can go back in and who will be told. Withdrawing also frees the organization to be changed (R-2.22, R-2.23,
// R-2.36)
const meta: Meta = { title: "proposals/proposal-twu-edit/withdraw-confirm" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

export const WithdrawConfirm: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a Team With Us proposal</Text>
      <Heading level={1}>Data platform team</Heading>
      <Text elementType="p">Status: <span style={badge} data-testid="proposal-status">Submitted</span></Text>
      <div data-testid="proposal-actions">
        <ButtonGroup ariaLabel="Proposal actions">
          <Button variant="secondary" data-testid="proposal-edit-button">Edit</Button>
          <Button variant="secondary" danger data-testid="proposal-withdraw-button">Withdraw</Button>
        </ButtonGroup>
      </div>
      <Text elementType="p" size="small" color="secondary">The rest of the page is as in the default story and is trimmed here.</Text>
      <Modal isOpen isDismissable>
        <AlertDialog
          variant="warning"
          title="Withdraw this proposal?"
          data-testid="proposal-withdraw-dialog"
          buttons={
            <>
              <Button variant="secondary" data-testid="proposal-dialog-cancel">Keep proposal</Button>
              <Button variant="primary" data-testid="proposal-withdraw-confirm">Withdraw proposal</Button>
            </>
          }
        >
          <Text elementType="p">
            It will no longer be considered. You can submit it again only while the opportunity is accepting proposals, until
            October 2, 2026 at 4:00 p.m. Pacific time. You and the administrators will be sent a withdrawal notice.
          </Text>
        </AlertDialog>
      </Modal>
    </div>
  ),
};
