import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Checkbox, Heading, InlineAlert, Text, TextField } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// user-profile · admin-refused — an administrator ticked the administrator box on a vendor's profile (R-4.12)
const meta: Meta = { title: "users/user-profile/admin-refused" };
export default meta;

const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

export const AdminRefused: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>User Profile</Heading>
        <Stack gap="medium">
          <Text elementType="p">Account type: <span data-testid="profile-account-type">Vendor</span></Text>
          <Text elementType="p">Status: <span style={badge} data-testid="profile-status-badge">Active</span></Text>
          <Text elementType="p" size="small" color="secondary">
            Account ID: <span data-testid="profile-user-identifier">0b6f2c1e-5a7d-4c3e-9f10-000000000003</span>
          </Text>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="details-heading">
          <Heading level={2} id="details-heading">Details</Heading>
          <TextField label="Sign-in username" value="test-vendor-1" isReadOnly data-testid="idp-username-field" />
          <TextField label="Name" value="Test Vendor One" isReadOnly data-testid="name-field" />
          <TextField label="Email address" value="vendor1@example.com" isReadOnly data-testid="email-field" />
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="permissions-heading">
          <Heading level={2} id="permissions-heading">Permissions</Heading>
          <Stack gap="small">
            <Checkbox isSelected={false} aria-describedby="admin-refused" data-testid="profile-admin-checkbox">Administrator</Checkbox>
            <div id="admin-refused">
              <InlineAlert variant="danger" role="alert" title="Vendors cannot be granted administrator permissions" />
            </div>
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
