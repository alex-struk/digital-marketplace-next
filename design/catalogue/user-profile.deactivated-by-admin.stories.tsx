import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Checkbox, Heading, Text, TextField } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// user-profile · deactivated-by-admin — the reactivation control is offered (R-4.19, R-4.30)
const meta: Meta = { title: "users/user-profile/deactivated-by-admin" };
export default meta;

const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

export const DeactivatedByAdmin: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>User Profile</Heading>
        <Stack gap="medium">
          <Text elementType="p">Account type: <span data-testid="profile-account-type">Public sector employee</span></Text>
          <Text elementType="p">Status: <span style={badge} data-testid="profile-status-badge">Inactive</span></Text>
          <Text elementType="p" size="small" color="secondary">
            Account ID: <span data-testid="profile-user-identifier">0b6f2c1e-5a7d-4c3e-9f10-000000000002</span>
          </Text>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="details-heading">
          <Heading level={2} id="details-heading">Details</Heading>
          <TextField label="Sign-in username" value="test-gov" isReadOnly data-testid="idp-username-field" />
          <TextField label="Name" value="Test Public Servant" isReadOnly data-testid="name-field" />
          <TextField label="Email address" value="gov@example.com" isReadOnly data-testid="email-field" />
          <TextField label="Job title" value="Procurement officer" isReadOnly data-testid="job-title-field" />
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="permissions-heading">
          <Heading level={2} id="permissions-heading">Permissions</Heading>
          <Checkbox data-testid="profile-admin-checkbox">Administrator</Checkbox>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="status-heading">
          <Heading level={2} id="status-heading">Account status</Heading>
          <Text elementType="p">An administrator deactivated this account on September 2, 2026.</Text>
          <Text elementType="p">Reactivating it lets the person sign in again. They will be told by email.</Text>
          <div>
            <Button variant="primary" data-testid="profile-reactivate-button">Reactivate account</Button>
          </div>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
