import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// user-profile-self-legal · default — a vendor whose acceptance of the current terms stands (R-4.33)
const meta: Meta = { title: "users/user-profile-self-legal/default" };
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

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Policies, Terms &amp; Agreements</Heading>
      <nav aria-label="Profile sections">
        <ul style={tabs}>
          <li><Link href="/users/me" data-testid="profile-tab-profile">Profile</Link></li>
          <li><Link href="/users/me?tab=capabilities" data-testid="profile-tab-capabilities">Capabilities</Link></li>
          <li><Link href="/users/me?tab=organizations" data-testid="profile-tab-organizations">Organizations</Link></li>
          <li><Link href="/users/me?tab=notifications" data-testid="profile-tab-notifications">Notifications</Link></li>
          <li><Link href="/users/me?tab=legal" aria-current="page" data-testid="profile-tab-legal">Legal</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="privacy-heading" style={stack} data-testid="legal-privacy-policy">
        <Heading level={2} id="privacy-heading">Privacy policy</Heading>
        <Text elementType="p">[Privacy policy text supplied by the service.]</Text>
        <Text elementType="p">You agreed to this policy when your account was created.</Text>
      </section>
      <section aria-labelledby="terms-heading" style={stack}>
        <Heading level={2} id="terms-heading">Terms and conditions</Heading>
        <Text elementType="p">
          <Link href="/content/terms-and-conditions" data-testid="legal-app-terms-link">Read the Digital Marketplace terms and conditions</Link>
        </Text>
        <Text elementType="p" data-testid="legal-accepted-on">You agreed to the terms and conditions on September 1, 2026 at 10:30 a.m.</Text>
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
