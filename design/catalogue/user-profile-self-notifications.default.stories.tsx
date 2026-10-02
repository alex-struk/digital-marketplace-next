import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// user-profile-self-notifications · default — notices of new opportunities turned on (R-4.29)
const meta: Meta = { title: "users/user-profile-self-notifications/default" };
export default meta;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Notifications</Heading>
        <nav aria-label="Profile sections">
          <Stack as="ul" direction="row" gap="medium">
            <li><Link href="/users/me" data-testid="profile-tab-profile">Profile</Link></li>
            <li><Link href="/users/me?tab=capabilities" data-testid="profile-tab-capabilities">Capabilities</Link></li>
            <li><Link href="/users/me?tab=organizations" data-testid="profile-tab-organizations">Organizations</Link></li>
            <li><Link href="/users/me?tab=notifications" aria-current="page" data-testid="profile-tab-notifications">Notifications</Link></li>
            <li><Link href="/users/me?tab=legal" data-testid="profile-tab-legal">Legal</Link></li>
          </Stack>
        </nav>
        <Text elementType="p" data-testid="notifications-email-address">
          Notifications are sent to vendor1@example.com. If this address is wrong, <Link href="/users/me">correct it on your profile</Link>.
        </Text>
        <Checkbox defaultSelected data-testid="notifications-new-opportunities-checkbox">
          Email me when new opportunities are posted
        </Checkbox>
        <div role="status" />
      </Stack>
    </PageContainer>
  ),
};
