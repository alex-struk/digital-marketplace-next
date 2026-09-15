import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import { Button, ButtonGroup, Form, Heading, Link, Text, TextField } from "@bcgov/design-system-react-components";

// user-profile-self · editing — a vendor editing their own details; no job title is asked of a vendor (R-4.18, R-4.27, R-4.28)
const meta: Meta = { title: "users/user-profile-self/editing" };
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

export const Editing: StoryObj = {
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
      <Text elementType="p">Account type: <span data-testid="profile-account-type">Vendor</span></Text>
      <Form validationBehavior="aria" style={stack}>
        <Heading level={2}>Edit your details</Heading>
        <div style={stack}>
          <Text elementType="p">Profile picture (optional)</Text>
          <Text elementType="p" size="small" color="secondary">No profile picture has been added.</Text>
          <div>
            <FileTrigger acceptedFileTypes={["image/*"]}>
              <Button variant="secondary" data-testid="change-avatar">Choose a profile picture</Button>
            </FileTrigger>
          </div>
        </div>
        <TextField label="Sign-in username" value="test-vendor-1" isReadOnly description="This cannot be changed." data-testid="idp-username-field" />
        <TextField id="profile-name" label="Name" defaultValue="Test Vendor One" isRequired maxLength={100} data-testid="name-field" />
        <TextField id="profile-email" label="Email address" type="email" defaultValue="vendor1@example.com" isRequired data-testid="email-field" />
        <ButtonGroup ariaLabel="Profile actions">
          <Button type="submit" variant="primary" data-testid="profile-save-button">Save changes</Button>
          <Button variant="secondary" data-testid="profile-cancel-button">Cancel</Button>
        </ButtonGroup>
      </Form>
    </div>
  ),
};
