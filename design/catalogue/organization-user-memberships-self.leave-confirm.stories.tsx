import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, Heading, Link, Modal, Text } from "@bcgov/design-system-react-components";

// organization-user-memberships-self · leave-confirm — a member asked to confirm leaving an organization; the
// membership becomes inactive, they leave its team and this list, and nobody is emailed (R-3.10, R-3.32)
const meta: Meta = { title: "organizations/organization-user-memberships-self/leave-confirm" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const tabs = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--layout-margin-large)",
  listStyle: "none",
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-none)",
} as const;
const base = "/users/me";

export const LeaveConfirm: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>My Organizations</Heading>
      <nav aria-label="Profile sections">
        <ul style={tabs}>
          <li><Link href={base} data-testid="profile-tab-profile">Profile</Link></li>
          <li><Link href={`${base}?tab=capabilities`} data-testid="profile-tab-capabilities">Capabilities</Link></li>
          <li><Link href={`${base}?tab=organizations`} aria-current="page" data-testid="profile-tab-organizations">Organizations</Link></li>
          <li><Link href={`${base}?tab=notifications`} data-testid="profile-tab-notifications">Notifications</Link></li>
          <li><Link href={`${base}?tab=legal`} data-testid="profile-tab-legal">Legal</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="affiliated-heading" style={stack}>
        <Heading level={2} id="affiliated-heading">Organizations you belong to</Heading>
        <Text elementType="p">Aurora Data Collective</Text>
        <div>
          <Button variant="tertiary" size="small" danger aria-label="Leave Aurora Data Collective" data-testid="membership-leave-button">Leave</Button>
        </div>
      </section>
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
    </div>
  ),
};
