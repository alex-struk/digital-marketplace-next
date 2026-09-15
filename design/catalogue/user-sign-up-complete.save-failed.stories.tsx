import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import { Button, Checkbox, Form, Heading, InlineAlert, Text, TextField } from "@bcgov/design-system-react-components";

// user-sign-up-complete · save-failed — the service refused the save; the cause is deliberately not named (R-4.6)
const meta: Meta = { title: "users/user-sign-up-complete/save-failed" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;

export const SaveFailed: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Complete Your Profile</Heading>
      <InlineAlert
        variant="danger"
        role="alert"
        title="Your profile could not be saved"
        description="Nothing you entered has been lost. Check your details and try again."
      />
      <Form validationBehavior="aria" style={stack}>
        <div style={stack}>
          <Text elementType="p">Profile picture (optional)</Text>
          <Text elementType="p" size="small" color="secondary">No profile picture has been added.</Text>
          <div>
            <FileTrigger acceptedFileTypes={["image/*"]}>
              <Button variant="secondary" data-testid="change-avatar">Choose a profile picture</Button>
            </FileTrigger>
          </div>
        </div>
        <TextField label="Sign-in username" value="test-vendor-1" isReadOnly data-testid="idp-username-field" />
        <TextField id="profile-name" label="Name" defaultValue="Test Vendor One" isRequired data-testid="name-field" />
        <TextField id="profile-email" label="Email address" type="email" defaultValue="vendor1@example.com" isRequired data-testid="email-field" />
        <Checkbox defaultSelected data-testid="sign-up-notifications-checkbox">Email me when new opportunities are posted</Checkbox>
        <Checkbox isRequired defaultSelected data-testid="sign-up-terms-checkbox">
          I have read and agree to the terms and conditions and the privacy policy
        </Checkbox>
        <div>
          <Button type="submit" variant="primary" data-testid="sign-up-complete-button">Complete profile</Button>
        </div>
      </Form>
    </div>
  ),
};
