import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, Checkbox, Heading, Link, Modal, Text } from "@bcgov/design-system-react-components";

// notification-unsubscribe-landing · default — a signed-in vendor arrived from the Unsubscribe offer at the end of an
// email announcing a new opportunity. Their own notification settings open with the question already asked, naming
// the address of whoever is signed in, not whoever the email was sent to (R-6.6, R-6.7). Nothing changes until
// Unsubscribe is pressed.
const meta: Meta = { title: "notifications/notification-unsubscribe-landing/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const tabs = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--layout-margin-large)",
  listStyle: "none",
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-none)",
} as const;

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Notifications</Heading>
      <nav aria-label="Profile sections">
        <ul style={tabs}>
          <li><Link href="/users/me" data-testid="profile-tab-profile">Profile</Link></li>
          <li><Link href="/users/me?tab=capabilities" data-testid="profile-tab-capabilities">Capabilities</Link></li>
          <li><Link href="/users/me?tab=organizations" data-testid="profile-tab-organizations">Organizations</Link></li>
          <li><Link href="/users/me?tab=notifications" aria-current="page" data-testid="profile-tab-notifications">Notifications</Link></li>
          <li><Link href="/users/me?tab=legal" data-testid="profile-tab-legal">Legal</Link></li>
        </ul>
      </nav>
      <Text elementType="p" data-testid="notifications-email-address">
        Notifications are sent to vendor1@example.com. If this address is wrong, <Link href="/users/me">correct it on your profile</Link>.
      </Text>
      <Text elementType="p">
        This setting covers only emails announcing newly published opportunities. Other emails from the service, such as
        those about opportunities you watch or proposals you have submitted, are not affected by it.
      </Text>
      <Checkbox defaultSelected data-testid="notifications-new-opportunities-checkbox">
        Email me when new opportunities are posted
      </Checkbox>
      <div role="status" />
      <Modal isOpen isDismissable>
        <AlertDialog
          variant="warning"
          title="Stop emails about new opportunities?"
          data-testid="unsubscribe-modal"
          buttons={
            <>
              <Button variant="secondary" data-testid="unsubscribe-cancel-button">Keep receiving them</Button>
              <Button variant="primary" data-testid="unsubscribe-confirm-button">Unsubscribe</Button>
            </>
          }
        >
          <Text elementType="p">
            You are signed in as Test Vendor One. <span data-testid="unsubscribe-confirmation-address">vendor1@example.com</span> will
            no longer be emailed when new opportunities are posted.
          </Text>
          <Text elementType="p">You can turn these emails back on at any time from this page.</Text>
        </AlertDialog>
      </Modal>
    </div>
  ),
};
