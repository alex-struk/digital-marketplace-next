import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Link, Text, TextField } from "@bcgov/design-system-react-components";

// organization-user-memberships-self · section-unavailable — a public sector employee asked for their own
// organizations section, which only a vendor's profile offers, and sees their profile section instead (R-4.34)
const meta: Meta = { title: "organizations/organization-user-memberships-self/section-unavailable" };
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

export const SectionUnavailable: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>User Profile</Heading>
      <nav aria-label="Profile sections">
        <ul style={tabs}>
          <li><Link href="/users/me" aria-current="page" data-testid="profile-tab-profile">Profile</Link></li>
          <li><Link href="/users/me?tab=notifications" data-testid="profile-tab-notifications">Notifications</Link></li>
        </ul>
      </nav>
      <Text elementType="p">Account type: <span data-testid="profile-account-type">Public sector employee</span></Text>
      <section aria-labelledby="details-heading" style={stack}>
        <Heading level={2} id="details-heading">Details</Heading>
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
    </div>
  ),
};
