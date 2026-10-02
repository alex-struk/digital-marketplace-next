import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, Heading, Modal, Text, TextField } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// user-profile · deactivate-confirm — an administrator asked to confirm deactivating another person's account (R-4.30)
const meta: Meta = { title: "users/user-profile/deactivate-confirm" };
export default meta;

const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

export const DeactivateConfirm: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>User Profile</Heading>
        <Stack gap="medium">
          <Text elementType="p">Account type: <span data-testid="profile-account-type">Public sector employee</span></Text>
          <Text elementType="p">Status: <span style={badge} data-testid="profile-status-badge">Active</span></Text>
        </Stack>
        <TextField label="Name" value="Test Public Servant" isReadOnly data-testid="name-field" />
        <div>
          <Button variant="secondary" danger data-testid="profile-deactivate-button">Deactivate account</Button>
        </div>
      </Stack>
      <Modal isOpen isDismissable>
        <AlertDialog
          variant="destructive"
          title="Deactivate this account?"
          data-testid="activation-modal"
          buttons={
            <>
              <Button variant="secondary" data-testid="activation-cancel-button">Cancel</Button>
              <Button variant="primary" danger data-testid="activation-confirm-button">Deactivate account</Button>
            </>
          }
        >
          <Text elementType="p">
            Test Public Servant will no longer be able to sign in. They will be sent an email saying an administrator has removed their access.
          </Text>
        </AlertDialog>
      </Modal>
    </PageContainer>
  ),
};
