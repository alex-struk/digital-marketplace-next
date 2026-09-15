import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// user-notice · sign-in-failed — /notice/authFailure (R-4.4, R-4.1, R-4.6)
const meta: Meta = { title: "users/user-notice/sign-in-failed" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const actions = { display: "flex", flexWrap: "wrap", gap: "var(--layout-margin-medium)" } as const;

export const SignInFailed: StoryObj = {
  render: () => (
    <div style={page}>
      <div style={stack} data-testid="notice-sign-in-failed">
        <Heading level={1}>Sign in failed</Heading>
        <Text elementType="p">We could not sign you in. Please try again.</Text>
      </div>
      <div style={actions}>
        <Link href="/sign-in" isButton buttonVariant="primary">Try signing in again</Link>
        <Link href="/" isButton buttonVariant="secondary" data-testid="notice-back-to-home">Back to home</Link>
      </div>
    </div>
  ),
};
