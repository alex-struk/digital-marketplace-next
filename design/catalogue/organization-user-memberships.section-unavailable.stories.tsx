import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Checkbox, Heading, Text, TextField } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// organization-user-memberships · section-unavailable — an administrator asked for a vendor's organizations section,
// which is not among the sections an administrator sees on somebody else's account, and is shown the profile
// section instead, with no membership control at all (R-4.34)
const meta: Meta = { title: "organizations/organization-user-memberships/section-unavailable" };
export default meta;

const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

export const SectionUnavailable: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>User Profile</Heading>
        <Stack gap="medium">
          <Text elementType="p">Account type: <span data-testid="profile-account-type">Vendor</span></Text>
          <Text elementType="p">Status: <span style={badge} data-testid="profile-status-badge">Active</span></Text>
        </Stack>
        <Stack as="section" aria-labelledby="details-heading" gap="medium">
          <Heading level={2} id="details-heading">Details</Heading>
          <TextField label="Sign-in username" value="test-vendor-1" isReadOnly data-testid="idp-username-field" />
          <TextField label="Name" value="Test Vendor One" isReadOnly data-testid="name-field" />
          <TextField label="Email address" value="vendor1@example.com" isReadOnly data-testid="email-field" />
        </Stack>
        <Stack as="section" aria-labelledby="permissions-heading" gap="medium">
          <Heading level={2} id="permissions-heading">Permissions</Heading>
          <Checkbox data-testid="profile-admin-checkbox">Administrator</Checkbox>
        </Stack>
        <Stack as="section" aria-labelledby="status-heading" gap="medium">
          <Heading level={2} id="status-heading">Account status</Heading>
          <div>
            <Button variant="secondary" danger data-testid="profile-deactivate-button">Deactivate account</Button>
          </div>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
