import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Link, Text, TextField } from "@bcgov/design-system-react-components";

// user-profile-self · administrator — an administrator's own profile: status shown, no administrator box,
// no deactivation control (R-4.12, R-4.31, R-4.34)
const meta: Meta = { title: "users/user-profile-self/administrator" };
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
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

export const Administrator: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>User Profile</Heading>
      <nav aria-label="Profile sections">
        <ul style={tabs}>
          <li><Link href="/users/me" aria-current="page" data-testid="profile-tab-profile">Profile</Link></li>
          <li><Link href="/users/me?tab=notifications" data-testid="profile-tab-notifications">Notifications</Link></li>
        </ul>
      </nav>
      <div style={stack}>
        <Text elementType="p">Account type: <span data-testid="profile-account-type">Public sector employee</span></Text>
        <Text elementType="p">Status: <span style={badge} data-testid="profile-status-badge">Active</span></Text>
        <Text elementType="p" size="small" color="secondary">
          Account ID: <span data-testid="profile-user-identifier">0b6f2c1e-5a7d-4c3e-9f10-000000000001</span>
        </Text>
      </div>
      <section aria-labelledby="details-heading" style={stack}>
        <Heading level={2} id="details-heading">Details</Heading>
        <Text elementType="p" size="small" color="secondary">No profile picture has been added.</Text>
        <TextField label="Sign-in username" value="test-admin" isReadOnly data-testid="idp-username-field" />
        <TextField label="Name" value="Test Administrator" isReadOnly data-testid="name-field" />
        <TextField label="Email address" value="admin@example.com" isReadOnly data-testid="email-field" />
        <TextField label="Job title" value="Service administrator" isReadOnly data-testid="job-title-field" />
        <div>
          <Button variant="primary" data-testid="profile-edit-button">Edit profile</Button>
        </div>
      </section>
      <section aria-labelledby="permissions-heading" style={stack}>
        <Heading level={2} id="permissions-heading">Permissions</Heading>
        <Text elementType="p" data-testid="profile-permissions-label">You have administrator permissions.</Text>
      </section>
    </div>
  ),
};
