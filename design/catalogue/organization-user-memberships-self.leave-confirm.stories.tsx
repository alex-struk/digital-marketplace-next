import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, Heading, Link, Modal, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// organization-user-memberships-self · leave-confirm — a member asked to confirm leaving an organization; the
// membership becomes inactive, they leave its team and this list, and nobody is emailed (R-3.10, R-3.32)
const meta: Meta = { title: "organizations/organization-user-memberships-self/leave-confirm" };
export default meta;

const base = "/users/me";

export const LeaveConfirm: StoryObj = {
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
          <Text elementType="p">Aurora Data Collective</Text>
          <div>
            <Button variant="tertiary" size="small" danger aria-label="Leave Aurora Data Collective" data-testid="membership-leave-button">Leave</Button>
          </div>
        </Stack>
      </Stack>
      <Modal isOpen isDismissable>
        <AlertDialog
          variant="destructive"
          title="Leave Aurora Data Collective?"
          data-testid="membership-leave-dialog"
          buttons={
            <>
              <Button variant="secondary" data-testid="membership-dialog-cancel">Cancel</Button>
              <Button variant="primary" danger data-testid="membership-confirm-button">Leave organization</Button>
            </>
          }
        >
          <Text elementType="p">
            You will no longer be on Aurora Data Collective’s team or be put forward on its proposals. To rejoin, you would need to be invited again.
          </Text>
        </AlertDialog>
      </Modal>
    </PageContainer>
  ),
};
