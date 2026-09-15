import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Checkbox, Heading, Text, TextField } from "@bcgov/design-system-react-components";

// user-profile-capabilities · section-unavailable — an administrator asked for a vendor's capabilities and is shown
// the profile section instead, with no capability control at all (R-4.8, R-4.34)
const meta: Meta = { title: "users/user-profile-capabilities/section-unavailable" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

export const SectionUnavailable: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>User Profile</Heading>
      <div style={stack}>
        <Text elementType="p">Account type: <span data-testid="profile-account-type">Vendor</span></Text>
        <Text elementType="p">Status: <span style={badge} data-testid="profile-status-badge">Active</span></Text>
      </div>
      <section aria-labelledby="details-heading" style={stack}>
        <Heading level={2} id="details-heading">Details</Heading>
        <TextField label="Sign-in username" value="test-vendor-1" isReadOnly data-testid="idp-username-field" />
        <TextField label="Name" value="Test Vendor One" isReadOnly data-testid="name-field" />
        <TextField label="Email address" value="vendor1@example.com" isReadOnly data-testid="email-field" />
      </section>
      <section aria-labelledby="permissions-heading" style={stack}>
        <Heading level={2} id="permissions-heading">Permissions</Heading>
        <Checkbox data-testid="profile-admin-checkbox">Administrator</Checkbox>
      </section>
      <section aria-labelledby="status-heading" style={stack}>
        <Heading level={2} id="status-heading">Account status</Heading>
        <div>
          <Button variant="secondary" danger data-testid="profile-deactivate-button">Deactivate account</Button>
        </div>
      </section>
    </div>
  ),
};
