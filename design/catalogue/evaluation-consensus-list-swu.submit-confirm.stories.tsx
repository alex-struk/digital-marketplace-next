import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, Heading, Modal, Text } from "@bcgov/design-system-react-components";

// evaluation-consensus-list-swu · submit-confirm — the chair pressed Submit final consensus scores and is asked to
// confirm; the owner and every administrator are told when it goes through (R-5.30, R-5.31)
const meta: Meta = { title: "evaluation/evaluation-consensus-list-swu/submit-confirm" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;

export const SubmitConfirm: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a Sprint With Us opportunity</Text>
      <Heading level={1}>Modernize the licence renewal service</Heading>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Consensus</Heading>
        <div>
          <Button variant="primary" data-testid="evaluation-submit-consensus">Submit final consensus scores</Button>
        </div>
        <Text elementType="p" size="small" color="secondary">The rest of the page is as in the ready story and is trimmed here.</Text>
      </section>
      <Modal isOpen isDismissable>
        <AlertDialog
          variant="confirmation"
          title="Submit the final consensus scores?"
          data-testid="evaluation-submit-consensus-dialog"
          buttons={
            <>
              <Button variant="secondary" data-testid="evaluation-dialog-cancel">Cancel</Button>
              <Button variant="primary" data-testid="evaluation-submit-consensus-confirm">Submit consensus scores</Button>
            </>
          }
        >
          <Text elementType="p">
            The opportunity's owner and every administrator will be told that the consensus is ready to be finalized. You can
            still change a consensus until the scores are finalized.
          </Text>
        </AlertDialog>
      </Modal>
    </div>
  ),
};
