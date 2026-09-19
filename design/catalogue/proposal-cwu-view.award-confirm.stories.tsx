import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, ButtonGroup, Heading, Modal, Text } from "@bcgov/design-system-react-components";

// proposal-cwu-view · award-confirm — Award was pressed on an evaluated proposal. The dialog says what happens to the
// other proposals and who is told (R-2.33, R-2.36)
const meta: Meta = { title: "proposals/proposal-cwu-view/award-confirm" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

export const AwardConfirm: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Code With Us proposal</Text>
      <Heading level={1}><span data-testid="proposal-proponent-name">Test Vendor</span></Heading>
      <Text elementType="p">Status: <span style={badge} data-testid="proposal-status">Evaluated</span></Text>
      <div data-testid="proposal-actions">
        <ButtonGroup ariaLabel="Proposal actions">
          <Button variant="primary" data-testid="proposal-award-button">Award</Button>
          <Button variant="secondary" danger data-testid="proposal-disqualify-button">Disqualify</Button>
        </ButtonGroup>
      </div>
      <Text elementType="p" size="small" color="secondary">The rest of the page is as in the evaluated story and is trimmed here.</Text>
      <Modal isOpen isDismissable>
        <AlertDialog
          variant="confirmation"
          title="Award this proposal?"
          data-testid="proposal-award-dialog"
          buttons={
            <>
              <Button variant="secondary" data-testid="proposal-dialog-cancel">Cancel</Button>
              <Button variant="primary" data-testid="proposal-award-confirm">Award proposal</Button>
            </>
          }
        >
          <Text elementType="p">
            The opportunity will be awarded to this proponent. Every other proposal still in contention will be marked not
            awarded. The winner will be sent an award notice and every other proponent a decision notice. Disqualified and
            withdrawn proposals keep their state.
          </Text>
        </AlertDialog>
      </Modal>
    </div>
  ),
};
