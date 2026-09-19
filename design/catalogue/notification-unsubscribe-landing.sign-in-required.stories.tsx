import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, InlineAlert, Text } from "@bcgov/design-system-react-components";

// notification-unsubscribe-landing · sign-in-required — somebody who is not signed in followed an email's Unsubscribe
// offer. There is no way to unsubscribe without signing in; they are shown sign-in and returned to their own
// notification settings, with the question asked, afterwards (R-6.7). This is the users domain's sign-in-required
// screen with the alert worded for this arrival.
const meta: Meta = { title: "notifications/notification-unsubscribe-landing/sign-in-required" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const card = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;

export const SignInRequired: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Sign In</Heading>
      <div data-testid="sign-in-required">
        <InlineAlert
          variant="info"
          role="status"
          title="Sign in to unsubscribe"
          description="Once you have signed in you will be taken to your notification settings and asked to confirm. The change applies to the account you sign in with."
        />
      </div>
      <section aria-labelledby="sign-in-vendor-heading" style={card} data-testid="sign-in-vendor-card">
        <Heading level={2} id="sign-in-vendor-heading">Vendor</Heading>
        <Text elementType="p">Sign in with your code-hosting account.</Text>
        <div>
          <Button variant="secondary" data-testid="sign-in-vendor-button">Sign in as a vendor</Button>
        </div>
      </section>
      <section aria-labelledby="sign-in-public-sector-heading" style={card} data-testid="sign-in-public-sector-card">
        <Heading level={2} id="sign-in-public-sector-heading">Public sector employee</Heading>
        <Text elementType="p">Sign in with your government account.</Text>
        <div>
          <Button variant="secondary" data-testid="sign-in-public-sector-button">Sign in as a public sector employee</Button>
        </div>
      </section>
    </div>
  ),
};
