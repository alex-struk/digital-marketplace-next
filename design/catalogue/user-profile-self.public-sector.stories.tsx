import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Link, Text, TextField } from "@bcgov/design-system-react-components";

// user-profile-self · public-sector — a public sector employee's own profile: job title, two sections,
// permissions as a read-only label (R-4.34, R-4.28, R-4.12)
const meta: Meta = { title: "users/user-profile-self/public-sector" };
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

export const PublicSector: StoryObj = {
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
        <Text elementType="p" size="small" color="secondary">
          Account ID: <span data-testid="profile-user-identifier">0b6f2c1e-5a7d-4c3e-9f10-000000000002</span>
        </Text>
      </div>
      <section aria-labelledby="details-heading" style={stack}>
        <Heading level={2} id="details-heading">Details</Heading>
        <Text elementType="p" size="small" color="secondary">No profile picture has been added.</Text>
        <TextField label="Sign-in username" value="test-gov" isReadOnly data-testid="idp-username-field" />
        <TextField label="Name" value="Test Public Servant" isReadOnly data-testid="name-field" />
        <TextField label="Email address" value="gov@example.com" isReadOnly data-testid="email-field" />
        <TextField label="Job title" value="Procurement officer" isReadOnly data-testid="job-title-field" />
        <div>
          <Button variant="primary" data-testid="profile-edit-button">Edit profile</Button>
        </div>
      </section>
      <section aria-labelledby="permissions-heading" style={stack}>
        <Heading level={2} id="permissions-heading">Permissions</Heading>
        <Text elementType="p" data-testid="profile-permissions-label">You do not have administrator permissions.</Text>
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
