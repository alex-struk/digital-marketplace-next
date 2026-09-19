import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Dialog, Form, Heading, Modal, NumberField, Text } from "@bcgov/design-system-react-components";

// proposal-cwu-view · score-dialog — Enter score was pressed. The one score is out of 100 with up to two decimal places,
// and entering it moves the proposal from under review to evaluated (R-2.26, R-2.27)
const meta: Meta = { title: "proposals/proposal-cwu-view/score-dialog" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const dialogBody = { display: "grid", gap: "var(--layout-margin-medium)", padding: "var(--layout-padding-large)" } as const;

export const ScoreDialog: StoryObj = {
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
        <Dialog isCloseable data-testid="proposal-score-dialog">
          <Form validationBehavior="aria" style={dialogBody}>
            <Heading level={2} slot="title">Enter score</Heading>
            <Text elementType="p">
              Entering a score moves this proposal from under review to evaluated. The score is recorded in its history.
            </Text>
            <NumberField
              label="Score (%)"
              isRequired
              description="Between 0 and 100, with up to two decimal places."
              data-testid="proposal-score-field"
            />
            <ButtonGroup ariaLabel="Score choices">
              <Button variant="secondary" data-testid="proposal-dialog-cancel">Cancel</Button>
              <Button type="submit" variant="primary" data-testid="proposal-score-confirm">Enter score</Button>
            </ButtonGroup>
          </Form>
        </Dialog>
      </Modal>
    </div>
  ),
};
