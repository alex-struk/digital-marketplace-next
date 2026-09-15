import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import { Button, ButtonGroup, Form, Heading, InlineAlert, TextField } from "@bcgov/design-system-react-components";

// user-profile-self · save-failed — the service refused the change (for example an email address another vendor
// already uses); the cause is deliberately not named (R-4.6)
const meta: Meta = { title: "users/user-profile-self/save-failed" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;

export const SaveFailed: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>User Profile</Heading>
      <InlineAlert
        variant="danger"
        role="alert"
        title="Your changes could not be saved"
        description="Nothing you entered has been lost. Check your details and try again."
      />
      <Form validationBehavior="aria" style={stack}>
        <Heading level={2}>Edit your details</Heading>
        <div>
          <FileTrigger acceptedFileTypes={["image/*"]}>
            <Button variant="secondary" data-testid="change-avatar">Choose a profile picture</Button>
          </FileTrigger>
        </div>
        <TextField label="Sign-in username" value="test-vendor-1" isReadOnly data-testid="idp-username-field" />
        <TextField id="profile-name" label="Name" defaultValue="Test Vendor One" isRequired maxLength={100} data-testid="name-field" />
        <TextField id="profile-email" label="Email address" type="email" defaultValue="vendor2@example.com" isRequired data-testid="email-field" />
        <ButtonGroup ariaLabel="Profile actions">
          <Button type="submit" variant="primary" data-testid="profile-save-button">Save changes</Button>
          <Button variant="secondary" data-testid="profile-cancel-button">Cancel</Button>
        </ButtonGroup>
      </Form>
    </div>
  ),
};
