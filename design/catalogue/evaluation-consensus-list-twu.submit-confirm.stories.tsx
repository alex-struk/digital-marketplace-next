import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, Heading, Modal, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// evaluation-consensus-list-twu · submit-confirm — the chair pressed Submit final consensus scores and is asked to
// confirm; the owner and every administrator are told when it goes through (R-5.30, R-5.31)
const meta: Meta = { title: "evaluation/evaluation-consensus-list-twu/submit-confirm" };
export default meta;

export const SubmitConfirm: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Manage a Team With Us opportunity</Text>
          <Heading level={1}>Data platform team</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="tab-heading">
          <Heading level={2} id="tab-heading">Consensus</Heading>
          <div>
            <Button variant="primary" data-testid="evaluation-submit-consensus">Submit final consensus scores</Button>
          </div>
          <Text elementType="p" size="small" color="secondary">The rest of the page is as in the ready story and is trimmed here.</Text>
        </Stack>
      </Stack>
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
    </PageContainer>
  ),
};
