import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import { Button, ButtonGroup, Form, Heading, Link, Text, TextField } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// user-profile · editing — the owner editing their own details, reached by identifier (R-4.18, R-4.27, R-4.28)
const meta: Meta = { title: "users/user-profile/editing" };
export default meta;

const base = "/users/0b6f2c1e-5a7d-4c3e-9f10-000000000002";

export const Editing: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>User Profile</Heading>
        <nav aria-label="Profile sections">
          <Stack as="ul" direction="row" gap="medium">
            <li><Link href={base} aria-current="page" data-testid="profile-tab-profile">Profile</Link></li>
            <li><Link href={`${base}?tab=notifications`} data-testid="profile-tab-notifications">Notifications</Link></li>
          </Stack>
        </nav>
        <Text elementType="p">Account type: <span data-testid="profile-account-type">Public sector employee</span></Text>
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
            <TextField label="Sign-in username" value="test-gov" isReadOnly description="This cannot be changed." data-testid="idp-username-field" />
            <TextField id="profile-name" label="Name" defaultValue="Test Public Servant" isRequired maxLength={100} data-testid="name-field" />
            <TextField id="profile-email" label="Email address" type="email" defaultValue="gov@example.com" isRequired data-testid="email-field" />
            <TextField id="profile-job-title" label="Job title (optional)" defaultValue="Procurement officer" maxLength={100} data-testid="job-title-field" />
            <ButtonGroup ariaLabel="Profile actions">
              <Button type="submit" variant="primary" data-testid="profile-save-button">Save changes</Button>
              <Button variant="secondary" data-testid="profile-cancel-button">Cancel</Button>
            </ButtonGroup>
          </Stack>
        </Form>
        {/* Editing replaces only the details; an ordinary public sector employee's permissions stay a read-only label (R-4.12). */}
        <Stack as="section" gap="medium" aria-labelledby="permissions-heading">
          <Heading level={2} id="permissions-heading">Permissions</Heading>
          <Text elementType="p" data-testid="profile-permissions-label">You do not have administrator permissions.</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
