import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Link, Text } from "@bcgov/design-system-react-components";

// user-sign-up-choose-account · default — R-4.1
const meta: Meta = { title: "users/user-sign-up-choose-account/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const card = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Choose Account Type</Heading>
      <Text elementType="p">
        Your account is created the first time you sign in. The kind of account you get depends on how you sign in.
      </Text>
      <section aria-labelledby="sign-up-vendor-heading" style={card} data-testid="sign-up-vendor-card">
        <Heading level={2} id="sign-up-vendor-heading">Vendor</Heading>
        <Text elementType="p">For people who want to register organizations and submit proposals. You sign up with your code-hosting account.</Text>
        <div>
          <Button variant="secondary" data-testid="sign-up-vendor-button">Sign up as a vendor</Button>
        </div>
      </section>
      <section aria-labelledby="sign-up-public-sector-heading" style={card} data-testid="sign-up-public-sector-card">
        <Heading level={2} id="sign-up-public-sector-heading">Public sector employee</Heading>
        <Text elementType="p">For public sector staff who create and manage opportunities. You sign up with your government account.</Text>
        <div>
          <Button variant="secondary" data-testid="sign-up-public-sector-button">Sign up as a public sector employee</Button>
        </div>
      </section>
      <Text elementType="p">
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </Text>
    </div>
  ),
};
