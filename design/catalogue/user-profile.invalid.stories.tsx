import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import { Button, ButtonGroup, Form, Heading, InlineAlert, Link, Text, TextField } from "@bcgov/design-system-react-components";

// user-profile · invalid — the owner saved with the name cleared and a malformed email address (R-4.27)
const meta: Meta = { title: "users/user-profile/invalid" };
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
const base = "/users/0b6f2c1e-5a7d-4c3e-9f10-000000000002";

export const Invalid: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>User Profile</Heading>
      <nav aria-label="Profile sections">
        <ul style={tabs}>
          <li><Link href={base} aria-current="page" data-testid="profile-tab-profile">Profile</Link></li>
          <li><Link href={`${base}?tab=notifications`} data-testid="profile-tab-notifications">Notifications</Link></li>
        </ul>
      </nav>
      <div tabIndex={-1}>
        <InlineAlert variant="danger" title="Your changes have 2 problems" role="alert">
          <ul>
            <li data-testid="field-error"><Link href="#profile-name">Name: enter your name</Link></li>
            <li data-testid="field-error">
              <Link href="#profile-email">Email address: enter an email address in a valid format, like name@example.com</Link>
            </li>
          </ul>
        </InlineAlert>
      </div>
      <Form validationBehavior="aria" style={stack}>
        <Heading level={2}>Edit your details</Heading>
        <div>
          <FileTrigger acceptedFileTypes={["image/*"]}>
            <Button variant="secondary" data-testid="change-avatar">Choose a profile picture</Button>
          </FileTrigger>
        </div>
        <TextField label="Sign-in username" value="test-gov" isReadOnly data-testid="idp-username-field" />
        <TextField id="profile-name" label="Name" defaultValue="" isRequired isInvalid errorMessage="Enter your name" data-testid="name-field" />
        <TextField
          id="profile-email"
          label="Email address"
          type="email"
          defaultValue="gov-at-example"
          isRequired
          isInvalid
          errorMessage="Enter an email address in a valid format, like name@example.com"
          data-testid="email-field"
        />
        <TextField id="profile-job-title" label="Job title (optional)" defaultValue="" maxLength={100} data-testid="job-title-field" />
        <ButtonGroup ariaLabel="Profile actions">
          <Button type="submit" variant="primary" data-testid="profile-save-button">Save changes</Button>
          <Button variant="secondary" data-testid="profile-cancel-button">Cancel</Button>
        </ButtonGroup>
      </Form>
    </div>
  ),
};
