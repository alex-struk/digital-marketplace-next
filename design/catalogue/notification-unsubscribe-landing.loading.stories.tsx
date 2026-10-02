import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// notification-unsubscribe-landing · loading — the signed-in account has not arrived yet. The question is not asked
// until it has, because the question must name the signed-in person's own address (R-6.7).
const meta: Meta = { title: "notifications/notification-unsubscribe-landing/loading" };
export default meta;

export const Loading: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Notifications</Heading>
        <Stack direction="row" gap="small" align="center" role="status">
          <ProgressCircle isIndeterminate aria-label="Loading your notification settings" />
          <Text>Loading your notification settings…</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
