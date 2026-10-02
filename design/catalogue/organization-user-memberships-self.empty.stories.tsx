import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// organization-user-memberships-self · empty — a vendor who owns no organization and belongs to none; each section
// says so in words instead of showing an empty table (wording is the design's own: gap 6)
const meta: Meta = { title: "organizations/organization-user-memberships-self/empty" };
export default meta;

const base = "/users/me";

export const Empty: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="medium">
          <Heading level={1}>My Organizations</Heading>
          <nav aria-label="Profile sections">
            <Stack as="ul" direction="row" gap="medium" align="center">
              <li><Link href={base} data-testid="profile-tab-profile">Profile</Link></li>
              <li><Link href={`${base}?tab=capabilities`} data-testid="profile-tab-capabilities">Capabilities</Link></li>
              <li><Link href={`${base}?tab=organizations`} aria-current="page" data-testid="profile-tab-organizations">Organizations</Link></li>
              <li><Link href={`${base}?tab=notifications`} data-testid="profile-tab-notifications">Notifications</Link></li>
              <li><Link href={`${base}?tab=legal`} data-testid="profile-tab-legal">Legal</Link></li>
            </Stack>
          </nav>
        </Stack>
        <Stack as="section" aria-labelledby="owned-heading" gap="medium">
          <Heading level={2} id="owned-heading">Organizations you own</Heading>
          <Text elementType="p" data-testid="membership-empty-owned">
            You do not own any organizations. Create one to propose on Sprint With Us and Team With Us opportunities.
          </Text>
          <div>
            <Link href="/organizations/create" isButton buttonVariant="primary" data-testid="organization-create-link">Create organization</Link>
          </div>
        </Stack>
        <Stack as="section" aria-labelledby="affiliated-heading" gap="medium">
          <Heading level={2} id="affiliated-heading">Organizations you belong to</Heading>
          <Text elementType="p" data-testid="membership-empty-affiliated">
            You do not belong to any other organizations. An organization’s owner or administrators can invite you by email.
          </Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
