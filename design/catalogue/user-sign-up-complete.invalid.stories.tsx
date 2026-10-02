import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import { Button, Checkbox, Form, Heading, InlineAlert, Link, Text, TextField } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// user-sign-up-complete · invalid — name cleared and email malformed on submit (R-4.27)
const meta: Meta = { title: "users/user-sign-up-complete/invalid" };
export default meta;

export const Invalid: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Complete Your Profile</Heading>
        <div tabIndex={-1}>
          <InlineAlert variant="danger" title="Your profile has 2 problems" role="alert">
            <ul>
              <li data-testid="field-error"><Link href="#profile-name">Name: enter your name</Link></li>
              <li data-testid="field-error">
                <Link href="#profile-email">Email address: enter an email address in a valid format, like name@example.com</Link>
              </li>
            </ul>
          </InlineAlert>
        </div>
        <Form validationBehavior="aria">
          <Stack gap="medium">
            <Stack gap="small">
              <Text elementType="p">Profile picture (optional)</Text>
              <Text elementType="p" size="small" color="secondary">No profile picture has been added.</Text>
              <div>
                <FileTrigger acceptedFileTypes={["image/*"]}>
                  <Button variant="secondary" data-testid="change-avatar">Choose a profile picture</Button>
                </FileTrigger>
              </div>
            </Stack>
            <TextField label="Sign-in username" value="test-vendor-1" isReadOnly data-testid="idp-username-field" />
            <TextField id="profile-name" label="Name" defaultValue="" isRequired isInvalid errorMessage="Enter your name" data-testid="name-field" />
            <TextField
              id="profile-email"
              label="Email address"
              type="email"
              defaultValue="vendor1-at-example"
              isRequired
              isInvalid
              errorMessage="Enter an email address in a valid format, like name@example.com"
              data-testid="email-field"
            />
            <Checkbox data-testid="sign-up-notifications-checkbox">Email me when new opportunities are posted</Checkbox>
            <Checkbox isRequired defaultSelected data-testid="sign-up-terms-checkbox">
              I have read and agree to the terms and conditions and the privacy policy
            </Checkbox>
            <div>
              <Button type="submit" variant="primary" data-testid="sign-up-complete-button">Complete profile</Button>
            </div>
          </Stack>
        </Form>
      </Stack>
    </PageContainer>
  ),
};
