import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// user-notice · default — /notice/deactivatedOwnAccount (R-4.9, R-4.5)
const meta: Meta = { title: "users/user-notice/default" };
export default meta;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="medium" data-testid="notice-deactivated-own-account">
          <Heading level={1}>Your account has been deactivated</Heading>
          <Text elementType="p">You have deactivated your Digital Marketplace account and have been signed out.</Text>
          <Text elementType="p">You can reactivate your account at any time by signing in again.</Text>
        </Stack>
        <div>
          <Link href="/" isButton buttonVariant="primary" data-testid="notice-back-to-home">Back to home</Link>
        </div>
      </Stack>
    </PageContainer>
  ),
};
