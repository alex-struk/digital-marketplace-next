import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, Heading, Modal, Text, TextField } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// user-profile · reactivate-confirm — an administrator asked to confirm reactivating an account they may reactivate (R-4.19, R-4.20)
const meta: Meta = { title: "users/user-profile/reactivate-confirm" };
export default meta;

const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

export const ReactivateConfirm: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>User Profile</Heading>
        <Stack gap="medium">
          <Text elementType="p">Account type: <span data-testid="profile-account-type">Public sector employee</span></Text>
          <Text elementType="p">Status: <span style={badge} data-testid="profile-status-badge">Inactive</span></Text>
        </Stack>
        <TextField label="Name" value="Test Public Servant" isReadOnly data-testid="name-field" />
        <div>
          <Button variant="primary" data-testid="profile-reactivate-button">Reactivate account</Button>
        </div>
      </Stack>
      <Modal isOpen isDismissable>
        <AlertDialog
          variant="confirmation"
          title="Reactivate this account?"
          data-testid="activation-modal"
          buttons={
            <>
              <Button variant="secondary" data-testid="activation-cancel-button">Cancel</Button>
              <Button variant="primary" data-testid="activation-confirm-button">Reactivate account</Button>
            </>
          }
        >
          <Text elementType="p">
            Test Public Servant will be able to sign in again. They will be sent an email saying an administrator has reactivated their account.
          </Text>
        </AlertDialog>
      </Modal>
    </PageContainer>
  ),
};
