import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, ProgressCircle, Text } from "@bcgov/design-system-react-components";

// organization-user-memberships-self · loading — the vendor's organizations have not arrived yet
const meta: Meta = { title: "organizations/organization-user-memberships-self/loading" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const row = { display: "flex", alignItems: "center", gap: "var(--layout-margin-small)" } as const;
const tabs = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--layout-margin-large)",
  listStyle: "none",
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-none)",
} as const;
const base = "/users/me";

export const Loading: StoryObj = {
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
      <div style={row} role="status">
        <ProgressCircle isIndeterminate aria-label="Loading organizations" />
        <Text>Loading organizations…</Text>
      </div>
    </div>
  ),
};
