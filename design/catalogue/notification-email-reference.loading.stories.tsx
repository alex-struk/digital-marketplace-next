import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// notification-email-reference · loading — an administrator has opened the page and the sample messages are still
// being composed. The heading and the page wrapper render at once.
const meta: Meta = { title: "notifications/notification-email-reference/loading" };
export default meta;

export const Loading: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large" data-testid="email-reference-page">
        <Heading level={1}>Email Notification Reference</Heading>
        <Stack direction="row" gap="small" align="center" role="status">
          <ProgressCircle isIndeterminate aria-label="Loading sample emails" />
          <Text>Loading sample emails…</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
