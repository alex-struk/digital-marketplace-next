import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// user-notice · sign-in-failed — /notice/authFailure (R-4.4, R-4.1, R-4.6)
const meta: Meta = { title: "users/user-notice/sign-in-failed" };
export default meta;

export const SignInFailed: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="medium" data-testid="notice-sign-in-failed">
          <Heading level={1}>Sign in failed</Heading>
          <Text elementType="p">We could not sign you in. Please try again.</Text>
        </Stack>
        <Stack direction="row" gap="medium">
          <Link href="/sign-in" isButton buttonVariant="primary">Try signing in again</Link>
          <Link href="/" isButton buttonVariant="secondary" data-testid="notice-back-to-home">Back to home</Link>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
