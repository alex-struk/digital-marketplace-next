import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, Heading, Modal, Text, TextField } from "@bcgov/design-system-react-components";

// user-profile-self · deactivate-confirm — a person asked to confirm deactivating their own account (R-4.9, R-4.5)
const meta: Meta = { title: "users/user-profile-self/deactivate-confirm" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;

export const DeactivateConfirm: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>User Profile</Heading>
      <Text elementType="p">Account type: <span data-testid="profile-account-type">Vendor</span></Text>
      <TextField label="Name" value="Test Vendor One" isReadOnly data-testid="name-field" />
      <div>
        <Button variant="secondary" danger data-testid="profile-deactivate-button">Deactivate account</Button>
      </div>
      <Modal isOpen isDismissable>
        <AlertDialog
          variant="destructive"
          title="Deactivate your account?"
          data-testid="activation-modal"
          buttons={
            <>
              <Button variant="secondary" data-testid="activation-cancel-button">Cancel</Button>
              <Button variant="primary" danger data-testid="activation-confirm-button">Deactivate my account</Button>
            </>
          }
        >
          <Text elementType="p">
            You will be signed out straight away. Your account will be kept, and you can reactivate it at any time by signing in again.
          </Text>
        </AlertDialog>
      </Modal>
    </div>
  ),
};
