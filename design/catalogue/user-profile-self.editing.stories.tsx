import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import { Button, ButtonGroup, Form, Heading, Link, Text, TextField } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// user-profile-self · editing — a vendor editing their own details; no job title is asked of a vendor (R-4.18, R-4.27, R-4.28)
const meta: Meta = { title: "users/user-profile-self/editing" };
export default meta;

export const Editing: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>User Profile</Heading>
        <nav aria-label="Profile sections">
          <Stack as="ul" direction="row" gap="medium">
            <li><Link href="/users/me" aria-current="page" data-testid="profile-tab-profile">Profile</Link></li>
            <li><Link href="/users/me?tab=capabilities" data-testid="profile-tab-capabilities">Capabilities</Link></li>
            <li><Link href="/users/me?tab=organizations" data-testid="profile-tab-organizations">Organizations</Link></li>
            <li><Link href="/users/me?tab=notifications" data-testid="profile-tab-notifications">Notifications</Link></li>
            <li><Link href="/users/me?tab=legal" data-testid="profile-tab-legal">Legal</Link></li>
          </Stack>
        </nav>
        <Text elementType="p">Account type: <span data-testid="profile-account-type">Vendor</span></Text>
        <Form validationBehavior="aria">
          <Stack gap="medium">
            <Heading level={2}>Edit your details</Heading>
            <Stack gap="small">
              <Text elementType="p">Profile picture (optional)</Text>
              <Text elementType="p" size="small" color="secondary">No profile picture has been added.</Text>
              <div>
                <FileTrigger acceptedFileTypes={["image/*"]}>
                  <Button variant="secondary" data-testid="change-avatar">Choose a profile picture</Button>
                </FileTrigger>
              </div>
            </Stack>
            <TextField label="Sign-in username" value="test-vendor-1" isReadOnly description="This cannot be changed." data-testid="idp-username-field" />
            <TextField id="profile-name" label="Name" defaultValue="Test Vendor One" isRequired maxLength={100} data-testid="name-field" />
            <TextField id="profile-email" label="Email address" type="email" defaultValue="vendor1@example.com" isRequired data-testid="email-field" />
            <ButtonGroup ariaLabel="Profile actions">
              <Button type="submit" variant="primary" data-testid="profile-save-button">Save changes</Button>
              <Button variant="secondary" data-testid="profile-cancel-button">Cancel</Button>
            </ButtonGroup>
          </Stack>
        </Form>
      </Stack>
    </PageContainer>
  ),
};
