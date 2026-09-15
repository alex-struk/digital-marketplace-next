import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// user-notice · default — /notice/deactivatedOwnAccount (R-4.9, R-4.5)
const meta: Meta = { title: "users/user-notice/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <div style={stack} data-testid="notice-deactivated-own-account">
        <Heading level={1}>Your account has been deactivated</Heading>
        <Text elementType="p">You have deactivated your Digital Marketplace account and have been signed out.</Text>
        <Text elementType="p">You can reactivate your account at any time by signing in again.</Text>
      </div>
      <div>
        <Link href="/" isButton buttonVariant="primary" data-testid="notice-back-to-home">Back to home</Link>
      </div>
    </div>
  ),
};
