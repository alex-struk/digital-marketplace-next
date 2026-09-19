import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, ButtonGroup, Heading, Modal, Text, TextField } from "@bcgov/design-system-react-components";

// content-create · publish-confirm — the administrator pressed Publish page and is asked to confirm, because the page is
// public from the moment it is published and there is no draft to hold it back (R-7.7, R-7.1 note)
const meta: Meta = { title: "content/content-create/publish-confirm" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;

export const PublishConfirm: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Create a New Page</Heading>
      <TextField label="Title" isRequired defaultValue="Hackathon rules" data-testid="content-title-field" />
      <TextField label="Address" isRequired defaultValue="hackathon-rules" data-testid="content-slug-field" />
      <ButtonGroup ariaLabel="Page actions">
        <Button variant="secondary" data-testid="content-cancel-button">Cancel</Button>
        <Button variant="primary" data-testid="content-publish-button">Publish page</Button>
      </ButtonGroup>
      <Modal isOpen isDismissable>
        <AlertDialog
          variant="confirmation"
          title="Publish this page?"
          data-testid="content-publish-dialog"
          buttons={
            <>
              <Button variant="secondary" data-testid="content-dialog-cancel">Cancel</Button>
              <Button variant="primary" data-testid="content-publish-confirm">Publish page</Button>
            </>
          }
        >
          <Text elementType="p">
            "Hackathon rules" will be public at /content/hackathon-rules as soon as it is published. Anyone can read it,
            including people who are not signed in.
          </Text>
        </AlertDialog>
      </Modal>
    </div>
  ),
};
