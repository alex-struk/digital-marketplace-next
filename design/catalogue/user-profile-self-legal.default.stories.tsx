import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// user-profile-self-legal · default — a vendor whose acceptance of the current terms stands (R-4.33)
const meta: Meta = { title: "users/user-profile-self-legal/default" };
export default meta;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Policies, Terms &amp; Agreements</Heading>
        <nav aria-label="Profile sections">
          <Stack as="ul" direction="row" gap="medium">
            <li><Link href="/users/me" data-testid="profile-tab-profile">Profile</Link></li>
            <li><Link href="/users/me?tab=capabilities" data-testid="profile-tab-capabilities">Capabilities</Link></li>
            <li><Link href="/users/me?tab=organizations" data-testid="profile-tab-organizations">Organizations</Link></li>
            <li><Link href="/users/me?tab=notifications" data-testid="profile-tab-notifications">Notifications</Link></li>
            <li><Link href="/users/me?tab=legal" aria-current="page" data-testid="profile-tab-legal">Legal</Link></li>
          </Stack>
        </nav>
        <Stack as="section" gap="medium" aria-labelledby="privacy-heading" data-testid="legal-privacy-policy">
          <Heading level={2} id="privacy-heading">Privacy policy</Heading>
          <Text elementType="p">[Privacy policy text supplied by the service.]</Text>
          <Text elementType="p">You agreed to this policy when your account was created.</Text>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="terms-heading">
          <Heading level={2} id="terms-heading">Terms and conditions</Heading>
          <Text elementType="p">
            <Link href="/content/terms-and-conditions" data-testid="legal-app-terms-link">Read the Digital Marketplace terms and conditions</Link>
          </Text>
          <Text elementType="p" data-testid="legal-accepted-on">You agreed to the terms and conditions on September 1, 2026 at 10:30 a.m.</Text>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="program-terms-heading">
          <Heading level={2} id="program-terms-heading">Program terms</Heading>
          <ul>
            <li><Link href="/content/code-with-us-terms-and-conditions" data-testid="legal-program-terms-link">Code With Us terms and conditions</Link></li>
            <li><Link href="/content/sprint-with-us-terms-and-conditions" data-testid="legal-program-terms-link">Sprint With Us terms and conditions</Link></li>
            <li><Link href="/content/team-with-us-terms-and-conditions" data-testid="legal-program-terms-link">Team With Us terms and conditions</Link></li>
          </ul>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
