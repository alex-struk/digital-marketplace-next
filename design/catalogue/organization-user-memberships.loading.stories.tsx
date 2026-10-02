import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// organization-user-memberships · loading — the vendor's organizations, reached by account identifier, have not arrived yet
const meta: Meta = { title: "organizations/organization-user-memberships/loading" };
export default meta;

const base = "/users/0b6f2c1e-5a7d-4c3e-9f10-000000000003";

export const Loading: StoryObj = {
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
        <Stack direction="row" align="center" gap="small" role="status">
          <ProgressCircle isIndeterminate aria-label="Loading organizations" />
          <Text>Loading organizations…</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
