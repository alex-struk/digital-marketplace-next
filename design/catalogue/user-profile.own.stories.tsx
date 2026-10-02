import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Link, Text, TextField } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// user-profile · own — a vendor viewing their own profile by its identifier (R-4.34, R-4.28, R-4.9)
const meta: Meta = { title: "users/user-profile/own" };
export default meta;

const base = "/users/0b6f2c1e-5a7d-4c3e-9f10-000000000003";

export const Own: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>User Profile</Heading>
        <nav aria-label="Profile sections">
          <Stack as="ul" direction="row" gap="medium">
            <li><Link href={base} aria-current="page" data-testid="profile-tab-profile">Profile</Link></li>
            <li><Link href={`${base}?tab=capabilities`} data-testid="profile-tab-capabilities">Capabilities</Link></li>
            <li><Link href={`${base}?tab=organizations`} data-testid="profile-tab-organizations">Organizations</Link></li>
            <li><Link href={`${base}?tab=notifications`} data-testid="profile-tab-notifications">Notifications</Link></li>
            <li><Link href={`${base}?tab=legal`} data-testid="profile-tab-legal">Legal</Link></li>
          </Stack>
        </nav>
        <Stack gap="medium">
          <Text elementType="p">Account type: <span data-testid="profile-account-type">Vendor</span></Text>
          <Text elementType="p" size="small" color="secondary">
            Account ID: <span data-testid="profile-user-identifier">0b6f2c1e-5a7d-4c3e-9f10-000000000003</span>
          </Text>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="details-heading">
          <Heading level={2} id="details-heading">Details</Heading>
          <Text elementType="p" size="small" color="secondary">No profile picture has been added.</Text>
          <TextField label="Sign-in username" value="test-vendor-1" isReadOnly data-testid="idp-username-field" />
          <TextField label="Name" value="Test Vendor One" isReadOnly data-testid="name-field" />
          <TextField label="Email address" value="vendor1@example.com" isReadOnly data-testid="email-field" />
          <div>
            <Button variant="primary" data-testid="profile-edit-button">Edit profile</Button>
          </div>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="status-heading">
          <Heading level={2} id="status-heading">Deactivate your account</Heading>
          <Text elementType="p">You will be signed out at once. You can come back at any time by signing in again.</Text>
          <div>
            <Button variant="secondary" danger data-testid="profile-deactivate-button">Deactivate account</Button>
          </div>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
