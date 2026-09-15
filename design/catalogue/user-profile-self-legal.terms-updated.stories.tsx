import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";

// user-profile-self-legal · terms-updated — an administrator announced changed terms; standing acceptance withdrawn (R-4.16)
const meta: Meta = { title: "users/user-profile-self-legal/terms-updated" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;

export const TermsUpdated: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Policies, Terms &amp; Agreements</Heading>
      <section aria-labelledby="privacy-heading" style={stack} data-testid="legal-privacy-policy">
        <Heading level={2} id="privacy-heading">Privacy policy</Heading>
        <Text elementType="p">[Privacy policy text supplied by the service.]</Text>
        <Text elementType="p">You agreed to this policy when your account was created.</Text>
      </section>
      <section aria-labelledby="terms-heading" style={stack}>
        <Heading level={2} id="terms-heading">Terms and conditions</Heading>
        <div data-testid="legal-terms-updated-warning">
          <InlineAlert
            variant="warning"
            title="The terms and conditions have changed"
            description="Review and agree to the updated terms and conditions to continue using the Digital Marketplace."
            buttons={
              <Button variant="primary" data-testid="legal-accept-updated-terms-button">Review and agree to the updated terms</Button>
            }
          />
        </div>
        <Text elementType="p">
          <Link href="/content/terms-and-conditions" data-testid="legal-app-terms-link">Read the Digital Marketplace terms and conditions</Link>
        </Text>
        <Text elementType="p" data-testid="legal-accepted-on">You last agreed to terms and conditions on September 1, 2026 at 10:30 a.m.</Text>
      </section>
      <section aria-labelledby="program-terms-heading" style={stack}>
        <Heading level={2} id="program-terms-heading">Program terms</Heading>
        <ul>
          <li><Link href="/content/code-with-us-terms-and-conditions" data-testid="legal-program-terms-link">Code With Us terms and conditions</Link></li>
          <li><Link href="/content/sprint-with-us-terms-and-conditions" data-testid="legal-program-terms-link">Sprint With Us terms and conditions</Link></li>
          <li><Link href="/content/team-with-us-terms-and-conditions" data-testid="legal-program-terms-link">Team With Us terms and conditions</Link></li>
        </ul>
      </section>
    </div>
  ),
};
