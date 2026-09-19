import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Dialog, Form, Heading, Modal, NumberField, Text } from "@bcgov/design-system-react-components";

// proposal-twu-view · score-dialog — Enter challenge score was pressed. Enter resource question scores opens the same
// dialog with one field per question. An out-of-range score is refused at the field, as in proposal-cwu-view ·
// score-invalid (R-2.28, R-2.30)
const meta: Meta = { title: "proposals/proposal-twu-view/score-dialog" };
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
      <Text elementType="p" size="small" color="secondary">Team With Us proposal</Text>
      <Heading level={1}><span data-testid="proposal-proponent-name">Example Digital Ltd.</span></Heading>
      <Text elementType="p">Status: <span style={badge} data-testid="proposal-status">Under review: challenge</span></Text>
      <div>
        <Button variant="primary" data-testid="proposal-score-challenge">Enter challenge score</Button>
      </div>
      <Text elementType="p" size="small" color="secondary">The rest of the page is as in the challenge-tab story and is trimmed here.</Text>
      <Modal isOpen isDismissable>
        <Dialog isCloseable data-testid="proposal-score-dialog">
          <Form validationBehavior="aria" style={dialogBody}>
            <Heading level={2} slot="title">Enter challenge score</Heading>
            <Text elementType="p">The score is recorded in the proposal's history.</Text>
            <NumberField
              label="Challenge score (%)"
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
