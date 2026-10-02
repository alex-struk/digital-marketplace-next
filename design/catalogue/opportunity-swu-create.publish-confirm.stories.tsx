import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, ButtonGroup, Heading, Modal, Text, TextField } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// opportunity-swu-create · publish-confirm — an administrator who pressed Publish is asked to confirm, because
// publishing notifies everyone who asked to hear of new opportunities (R-1.22, R-1.34, R-1.48)
const meta: Meta = { title: "opportunities/opportunity-swu-create/publish-confirm" };
export default meta;

export const PublishConfirm: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Create a Sprint With Us opportunity</Heading>
        <TextField label="Title" isRequired defaultValue="Modernize the licence renewal service" data-testid="opportunity-title-field" />
        <ButtonGroup ariaLabel="Opportunity actions">
          <Button variant="secondary" data-testid="opportunity-save-draft">Save draft</Button>
          <Button variant="primary" data-testid="opportunity-publish">Publish</Button>
        </ButtonGroup>
      </Stack>
      <Modal isOpen isDismissable>
        <AlertDialog
          variant="confirmation"
          title="Publish this opportunity?"
          data-testid="opportunity-publish-dialog"
          buttons={
            <>
              <Button variant="secondary" data-testid="opportunity-dialog-cancel">Cancel</Button>
              <Button variant="primary" data-testid="opportunity-publish-confirm">Publish opportunity</Button>
            </>
          }
        >
          <Text elementType="p">
            Everyone will be able to read it and send proposals until its proposal deadline. Everyone who has asked to hear
            about new opportunities will be emailed, and its author will be sent a confirmation. The evaluation panel will be
            told they are on it.
          </Text>
        </AlertDialog>
      </Modal>
    </PageContainer>
  ),
};
