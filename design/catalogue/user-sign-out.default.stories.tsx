import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";

// user-sign-out · default — session ended with the service and the identity provider (R-4.17)
const meta: Meta = { title: "users/user-sign-out/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Signed Out</Heading>
      <div data-testid="sign-out-success">
        <InlineAlert variant="success" role="status" title="You have successfully signed out" />
      </div>
      <Text elementType="p">
        <Link href="/sign-in">Sign in again</Link>
      </Text>
    </div>
  ),
};
