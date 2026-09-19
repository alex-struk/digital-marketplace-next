import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, ButtonGroup, Heading, Modal, Text, TextArea } from "@bcgov/design-system-react-components";

// proposal-cwu-view · disqualify-invalid — Disqualify proposal was pressed with no reason. It is refused at the field,
// focus goes there, and the proposal is not disqualified (R-2.34)
const meta: Meta = { title: "proposals/proposal-cwu-view/disqualify-invalid" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

export const DisqualifyInvalid: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Code With Us proposal</Text>
      <Heading level={1}><span data-testid="proposal-proponent-name">Test Vendor</span></Heading>
      <Text elementType="p">Status: <span style={badge} data-testid="proposal-status">Under review</span></Text>
      <div data-testid="proposal-actions">
        <ButtonGroup ariaLabel="Proposal actions">
          <Button variant="primary" data-testid="proposal-enter-score">Enter score</Button>
          <Button variant="secondary" danger data-testid="proposal-disqualify-button">Disqualify</Button>
        </ButtonGroup>
      </div>
      <Text elementType="p" size="small" color="secondary">The rest of the page is as in the default story and is trimmed here.</Text>
      <Modal isOpen isDismissable>
        <AlertDialog
          variant="destructive"
          title="Disqualify this proposal?"
          data-testid="proposal-disqualify-dialog"
          buttons={
            <>
              <Button variant="secondary" data-testid="proposal-dialog-cancel">Cancel</Button>
              <Button variant="primary" danger data-testid="proposal-disqualify-confirm">Disqualify proposal</Button>
            </>
          }
        >
          <Text elementType="p">The proposal will no longer be evaluated. The reason is kept in its history.</Text>
          <TextArea
            label="Reason"
            isRequired
            maxLength={5000}
            description="Between 1 and 5,000 characters."
            defaultValue=""
            isInvalid
            errorMessage="Enter a reason for disqualifying this proposal"
            data-testid="proposal-disqualify-reason-field"
          />
        </AlertDialog>
      </Modal>
    </div>
  ),
};
