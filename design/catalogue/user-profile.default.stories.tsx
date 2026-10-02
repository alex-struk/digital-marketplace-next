import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Checkbox, Heading, Text, TextField } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// user-profile · default — an administrator viewing another person's active account (R-4.18, R-4.12, R-4.30, R-4.34)
const meta: Meta = { title: "users/user-profile/default" };
export default meta;

const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>User Profile</Heading>
        <Stack gap="medium">
          <Text elementType="p">Account type: <span data-testid="profile-account-type">Public sector employee</span></Text>
          <Text elementType="p">Status: <span style={badge} data-testid="profile-status-badge">Active</span></Text>
          <Text elementType="p" size="small" color="secondary">
            Account ID: <span data-testid="profile-user-identifier">0b6f2c1e-5a7d-4c3e-9f10-000000000002</span>
          </Text>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="details-heading">
          <Heading level={2} id="details-heading">Details</Heading>
          <Text elementType="p" size="small" color="secondary">No profile picture has been added.</Text>
          <TextField label="Sign-in username" value="test-gov" isReadOnly data-testid="idp-username-field" />
          <TextField label="Name" value="Test Public Servant" isReadOnly data-testid="name-field" />
          <TextField label="Email address" value="gov@example.com" isReadOnly data-testid="email-field" />
          <TextField label="Job title" value="Procurement officer" isReadOnly data-testid="job-title-field" />
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="permissions-heading">
          <Heading level={2} id="permissions-heading">Permissions</Heading>
          <Stack gap="small">
            <Checkbox aria-describedby="admin-hint" data-testid="profile-admin-checkbox">Administrator</Checkbox>
            <Text id="admin-hint" elementType="p" size="small" color="secondary">
              The change takes effect as soon as you tick or untick the box.
            </Text>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="status-heading">
          <Heading level={2} id="status-heading">Account status</Heading>
          <Text elementType="p">Deactivating this account removes the person’s access. They will be told by email.</Text>
          <div>
            <Button variant="secondary" danger data-testid="profile-deactivate-button">Deactivate account</Button>
          </div>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
