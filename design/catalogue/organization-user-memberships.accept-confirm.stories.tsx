import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, Heading, Link, Modal, Text } from "@bcgov/design-system-react-components";

// organization-user-memberships · accept-confirm — the invited person, on their organizations reached by account
// identifier, is asked to confirm joining; nothing changes until they do (R-3.9, R-3.31, R-3.35)
const meta: Meta = { title: "organizations/organization-user-memberships/accept-confirm" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const tabs = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--layout-margin-large)",
  listStyle: "none",
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-none)",
} as const;
const base = "/users/0b6f2c1e-5a7d-4c3e-9f10-000000000003";

export const AcceptConfirm: StoryObj = {
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
        <Text elementType="p">
          Tidewater Analytics Inc. <span style={badge} data-testid="organization-pending-badge">Pending</span>
        </Text>
        <div>
          <Button variant="tertiary" size="small" aria-label="Accept the invitation from Tidewater Analytics Inc." data-testid="membership-approve-button">
            Accept
          </Button>
        </div>
      </section>
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
    </div>
  ),
};
