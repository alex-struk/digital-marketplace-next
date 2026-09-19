import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// organization-user-memberships-self · empty — a vendor who owns no organization and belongs to none; each section
// says so in words instead of showing an empty table (wording is the design's own: gap 6)
const meta: Meta = { title: "organizations/organization-user-memberships-self/empty" };
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

export const Empty: StoryObj = {
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
      <section aria-labelledby="owned-heading" style={stack}>
        <Heading level={2} id="owned-heading">Organizations you own</Heading>
        <Text elementType="p" data-testid="membership-empty-owned">
          You do not own any organizations. Create one to propose on Sprint With Us and Team With Us opportunities.
        </Text>
        <div>
          <Link href="/organizations/create" isButton buttonVariant="primary" data-testid="organization-create-link">Create organization</Link>
        </div>
      </section>
      <section aria-labelledby="affiliated-heading" style={stack}>
        <Heading level={2} id="affiliated-heading">Organizations you belong to</Heading>
        <Text elementType="p" data-testid="membership-empty-affiliated">
          You do not belong to any other organizations. An organization’s owner or administrators can invite you by email.
        </Text>
      </section>
    </div>
  ),
};
