import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox, Heading, Link, Text } from "@bcgov/design-system-react-components";

// notification-unsubscribe-landing · unsubscribed — the signed-in person pressed Unsubscribe. The dialog has closed,
// focus is back on the checkbox, the checkbox is cleared, and the change is announced. It is the signed-in person's
// own notices that stopped (R-6.7). The announcement's wording is the design's own (DESIGN.md, notifications gap 4).
const meta: Meta = { title: "notifications/notification-unsubscribe-landing/unsubscribed" };
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

export const Unsubscribed: StoryObj = {
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
      <Checkbox data-testid="notifications-new-opportunities-checkbox">
        Email me when new opportunities are posted
      </Checkbox>
      <div role="status">
        <Text elementType="p">You have unsubscribed. vendor1@example.com will no longer be emailed about new opportunities.</Text>
      </div>
    </div>
  ),
};
