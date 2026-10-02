import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, Heading, Link, Modal, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// organization-user-memberships · decline-confirm — the invited person, on their organizations reached by account
// identifier, is asked to confirm declining; declining is as direct as accepting (R-3.32, R-3.35)
const meta: Meta = { title: "organizations/organization-user-memberships/decline-confirm" };
export default meta;

const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const base = "/users/0b6f2c1e-5a7d-4c3e-9f10-000000000003";

export const DeclineConfirm: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="medium">
          <Heading level={1}>My Organizations</Heading>
          <nav aria-label="Profile sections">
            <Stack as="ul" direction="row" gap="medium" align="center">
              <li><Link href={base} data-testid="profile-tab-profile">Profile</Link></li>
              <li><Link href={`${base}?tab=capabilities`} data-testid="profile-tab-capabilities">Capabilities</Link></li>
              <li><Link href={`${base}?tab=organizations`} aria-current="page" data-testid="profile-tab-organizations">Organizations</Link></li>
              <li><Link href={`${base}?tab=notifications`} data-testid="profile-tab-notifications">Notifications</Link></li>
              <li><Link href={`${base}?tab=legal`} data-testid="profile-tab-legal">Legal</Link></li>
            </Stack>
          </nav>
        </Stack>
        <Stack as="section" aria-labelledby="affiliated-heading" gap="medium">
          <Heading level={2} id="affiliated-heading">Organizations you belong to</Heading>
          <Text elementType="p">
            Tidewater Analytics Inc. <span style={badge} data-testid="organization-pending-badge">Pending</span>
          </Text>
          <div>
            <Button variant="tertiary" size="small" danger aria-label="Decline the invitation from Tidewater Analytics Inc." data-testid="membership-reject-button">
              Decline
            </Button>
          </div>
        </Stack>
      </Stack>
      <Modal isOpen isDismissable>
        <AlertDialog
          variant="destructive"
          title="Decline the invitation from Tidewater Analytics Inc.?"
          data-testid="membership-decline-dialog"
          buttons={
            <>
              <Button variant="secondary" data-testid="membership-dialog-cancel">Cancel</Button>
              <Button variant="primary" danger data-testid="membership-confirm-button">Decline invitation</Button>
            </>
          }
        >
          <Text elementType="p">
            The invitation will be removed and you will not join the team. Its owner will be emailed that you declined.
          </Text>
        </AlertDialog>
      </Modal>
    </PageContainer>
  ),
};
