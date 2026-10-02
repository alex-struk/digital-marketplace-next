import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Link, Text, TextField } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// user-profile-self-legal · section-unavailable — a public sector employee asked for the legal section, which only a
// vendor is shown, and sees their profile section instead (R-4.33, R-4.34)
const meta: Meta = { title: "users/user-profile-self-legal/section-unavailable" };
export default meta;

export const SectionUnavailable: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>User Profile</Heading>
        <nav aria-label="Profile sections">
          <Stack as="ul" direction="row" gap="medium">
            <li><Link href="/users/me" aria-current="page" data-testid="profile-tab-profile">Profile</Link></li>
            <li><Link href="/users/me?tab=notifications" data-testid="profile-tab-notifications">Notifications</Link></li>
          </Stack>
        </nav>
        <Text elementType="p">Account type: <span data-testid="profile-account-type">Public sector employee</span></Text>
        <Stack as="section" gap="medium" aria-labelledby="details-heading">
          <Heading level={2} id="details-heading">Details</Heading>
          <TextField label="Sign-in username" value="test-gov" isReadOnly data-testid="idp-username-field" />
          <TextField label="Name" value="Test Public Servant" isReadOnly data-testid="name-field" />
          <TextField label="Email address" value="gov@example.com" isReadOnly data-testid="email-field" />
          <TextField label="Job title" value="Procurement officer" isReadOnly data-testid="job-title-field" />
          <div>
            <Button variant="primary" data-testid="profile-edit-button">Edit profile</Button>
          </div>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="permissions-heading">
          <Heading level={2} id="permissions-heading">Permissions</Heading>
          <Text elementType="p" data-testid="profile-permissions-label">You do not have administrator permissions.</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
