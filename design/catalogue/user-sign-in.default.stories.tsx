import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// user-sign-in · default — R-4.1, R-4.22
const meta: Meta = { title: "users/user-sign-in/default" };
export default meta;

// A card's border and inner padding are its own; its content is laid out by the stack.
const card = {
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Sign In</Heading>
        <Text elementType="p">Choose the kind of account you sign in with.</Text>
        <section aria-labelledby="sign-in-vendor-heading" style={card} data-testid="sign-in-vendor-card">
          <Stack gap="medium">
            <Heading level={2} id="sign-in-vendor-heading">Vendor</Heading>
            <Text elementType="p">Sign in with your code-hosting account to register organizations and submit proposals.</Text>
            <div>
              <Button variant="secondary" data-testid="sign-in-vendor-button">Sign in as a vendor</Button>
            </div>
          </Stack>
        </section>
        <section aria-labelledby="sign-in-public-sector-heading" style={card} data-testid="sign-in-public-sector-card">
          <Stack gap="medium">
            <Heading level={2} id="sign-in-public-sector-heading">Public sector employee</Heading>
            <Text elementType="p">Sign in with your government account to create and manage opportunities.</Text>
            <div>
              <Button variant="secondary" data-testid="sign-in-public-sector-button">Sign in as a public sector employee</Button>
            </div>
          </Stack>
        </section>
        <Text elementType="p">
          Don’t have an account? <Link href="/sign-up" data-testid="sign-in-go-to-sign-up">Sign up</Link>
        </Text>
      </Stack>
    </PageContainer>
  ),
};
