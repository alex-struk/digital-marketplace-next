import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, Heading, Link, Modal, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// organization-user-memberships-self · accept-confirm — the invited person, arriving from the invitation email's
// accept choice or pressing Accept here, is asked to confirm joining; nothing changes until they do (R-3.9, R-3.31, R-3.35)
const meta: Meta = { title: "organizations/organization-user-memberships-self/accept-confirm" };
export default meta;

const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const base = "/users/me";

export const AcceptConfirm: StoryObj = {
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
            <Button variant="tertiary" size="small" aria-label="Accept the invitation from Tidewater Analytics Inc." data-testid="membership-approve-button">
              Accept
            </Button>
          </div>
        </Stack>
      </Stack>
      <Modal isOpen isDismissable>
        <AlertDialog
          variant="confirmation"
          title="Join Tidewater Analytics Inc.?"
          data-testid="membership-accept-dialog"
          buttons={
            <>
              <Button variant="secondary" data-testid="membership-dialog-cancel">Cancel</Button>
              <Button variant="primary" data-testid="membership-confirm-button">Join organization</Button>
            </>
          }
        >
          <Text elementType="p">
            You will join Tidewater Analytics Inc.’s team and can be put forward on its proposals. Its owner will be emailed that you accepted.
          </Text>
        </AlertDialog>
      </Modal>
    </PageContainer>
  ),
};
