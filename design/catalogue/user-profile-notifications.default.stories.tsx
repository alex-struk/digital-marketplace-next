import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox, Heading, Link, Text } from "@bcgov/design-system-react-components";

// user-profile-notifications · default — notices of new opportunities turned on (R-4.29)
const meta: Meta = { title: "users/user-profile-notifications/default" };
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
const base = "/users/0b6f2c1e-5a7d-4c3e-9f10-000000000003";

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Notifications</Heading>
      <nav aria-label="Profile sections">
        <ul style={tabs}>
          <li><Link href={base} data-testid="profile-tab-profile">Profile</Link></li>
          <li><Link href={`${base}?tab=capabilities`} data-testid="profile-tab-capabilities">Capabilities</Link></li>
          <li><Link href={`${base}?tab=organizations`} data-testid="profile-tab-organizations">Organizations</Link></li>
          <li><Link href={`${base}?tab=notifications`} aria-current="page" data-testid="profile-tab-notifications">Notifications</Link></li>
          <li><Link href={`${base}?tab=legal`} data-testid="profile-tab-legal">Legal</Link></li>
        </ul>
      </nav>
      <Text elementType="p" data-testid="notifications-email-address">
        Notifications are sent to vendor1@example.com. If this address is wrong, <Link href={base}>correct it on your profile</Link>.
      </Text>
      <Checkbox defaultSelected data-testid="notifications-new-opportunities-checkbox">
        Email me when new opportunities are posted
      </Checkbox>
      <div role="status" />
    </div>
  ),
};
