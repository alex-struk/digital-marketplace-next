import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, ButtonGroup, Heading, Modal, Text, TextField } from "@bcgov/design-system-react-components";

// content-edit · publish-confirm — the administrator pressed Publish changes and is asked to confirm. Readers see the new
// wording at once; the replaced wording is kept as an earlier version that nothing in the service can show (R-7.8, R-7.23).
const meta: Meta = { title: "content/content-edit/publish-confirm" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;

export const PublishConfirm: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a page</Text>
      <Heading level={1}>Hackathon rules</Heading>
      <TextField label="Title" isRequired defaultValue="Hackathon rules" data-testid="content-title-field" />
      <ButtonGroup ariaLabel="Edit actions">
        <Button variant="secondary" data-testid="content-cancel-button">Cancel</Button>
        <Button variant="primary" data-testid="content-publish-changes-button">Publish changes</Button>
      </ButtonGroup>
      <Modal isOpen isDismissable>
        <AlertDialog
          variant="confirmation"
          title="Publish your changes?"
          data-testid="content-publish-changes-dialog"
          buttons={
            <>
              <Button variant="secondary" data-testid="content-dialog-cancel">Cancel</Button>
              <Button variant="primary" data-testid="content-publish-changes-confirm">Publish changes</Button>
            </>
          }
        >
          <Text elementType="p">
            Everyone reading /content/hackathon-rules will see the new wording straight away. The wording it replaces is
            kept on record, but it cannot be viewed or restored from the service.
          </Text>
        </AlertDialog>
      </Modal>
    </div>
  ),
};
