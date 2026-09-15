import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Link, Text, TextField } from "@bcgov/design-system-react-components";

// user-profile-self · default — a vendor's own profile at /users/me (R-4.26, R-4.34, R-4.28, R-4.9)
const meta: Meta = { title: "users/user-profile-self/default" };
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

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>User Profile</Heading>
      <nav aria-label="Profile sections">
        <ul style={tabs}>
          <li><Link href="/users/me" aria-current="page" data-testid="profile-tab-profile">Profile</Link></li>
          <li><Link href="/users/me?tab=capabilities" data-testid="profile-tab-capabilities">Capabilities</Link></li>
          <li><Link href="/users/me?tab=organizations" data-testid="profile-tab-organizations">Organizations</Link></li>
          <li><Link href="/users/me?tab=notifications" data-testid="profile-tab-notifications">Notifications</Link></li>
          <li><Link href="/users/me?tab=legal" data-testid="profile-tab-legal">Legal</Link></li>
        </ul>
      </nav>
      <div style={stack}>
        <Text elementType="p">Account type: <span data-testid="profile-account-type">Vendor</span></Text>
        <Text elementType="p" size="small" color="secondary">
          Account ID: <span data-testid="profile-user-identifier">0b6f2c1e-5a7d-4c3e-9f10-000000000003</span>
        </Text>
      </div>
      <section aria-labelledby="details-heading" style={stack}>
        <Heading level={2} id="details-heading">Details</Heading>
        <Text elementType="p" size="small" color="secondary">No profile picture has been added.</Text>
        <TextField label="Sign-in username" value="test-vendor-1" isReadOnly data-testid="idp-username-field" />
        <TextField label="Name" value="Test Vendor One" isReadOnly data-testid="name-field" />
        <TextField label="Email address" value="vendor1@example.com" isReadOnly data-testid="email-field" />
        <div>
          <Button variant="primary" data-testid="profile-edit-button">Edit profile</Button>
        </div>
      </section>
      <section aria-labelledby="status-heading" style={stack}>
        <Heading level={2} id="status-heading">Deactivate your account</Heading>
        <Text elementType="p">You will be signed out at once. You can come back at any time by signing in again.</Text>
        <div>
          <Button variant="secondary" danger data-testid="profile-deactivate-button">Deactivate account</Button>
        </div>
      </section>
    </div>
  ),
};
