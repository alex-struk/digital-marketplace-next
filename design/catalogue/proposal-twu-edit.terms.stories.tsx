import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Checkbox, Dialog, Heading, Link, Modal, Text } from "@bcgov/design-system-react-components";

// proposal-twu-edit · terms — Submit proposal (or Save changes and submit) was pressed on a draft. The terms dialog is
// open, and its Submit proposal button stays disabled until both terms are ticked (R-2.3, R-2.17)
const meta: Meta = { title: "proposals/proposal-twu-edit/terms" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const dialogBody = { display: "grid", gap: "var(--layout-margin-medium)", padding: "var(--layout-padding-large)" } as const;

export const Terms: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a Team With Us proposal</Text>
      <Heading level={1}>Data platform team</Heading>
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
        <Dialog isCloseable data-testid="proposal-terms-dialog">
          <div style={dialogBody}>
            <Heading level={2} slot="title">Submit your proposal</Heading>
            <Text elementType="p">
              To submit, accept the Team With Us terms and conditions and the Digital Marketplace terms and conditions. Your
              acceptance is recorded when you submit.
            </Text>
            <Text elementType="p">
              Read the <Link href="/content/team-with-us-terms-and-conditions">Team With Us terms and conditions</Link> and the{" "}
              <Link href="/content/terms-and-conditions">Digital Marketplace terms and conditions</Link>.
            </Text>
            <Checkbox isRequired data-testid="proposal-accept-program-terms">I accept the Team With Us terms and conditions</Checkbox>
            <Checkbox isRequired data-testid="proposal-accept-app-terms">I accept the Digital Marketplace terms and conditions</Checkbox>
            <Text id="proposal-terms-hint" elementType="p" size="small" color="secondary">Tick both boxes to submit.</Text>
            <ButtonGroup ariaLabel="Submit choices">
              <Button variant="secondary" data-testid="proposal-dialog-cancel">Cancel</Button>
              <Button variant="primary" isDisabled aria-describedby="proposal-terms-hint" data-testid="proposal-submit-confirm">
                Submit proposal
              </Button>
            </ButtonGroup>
          </div>
        </Dialog>
      </Modal>
    </div>
  ),
};
