import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// user-sign-out · loading — the sign-out request is still in progress (R-4.17)
const meta: Meta = { title: "users/user-sign-out/loading" };
export default meta;

export const Loading: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Signing Out</Heading>
        <Stack direction="row" gap="small" align="center" role="status">
          <ProgressCircle isIndeterminate aria-label="Signing out" />
          <Text>Signing you out…</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
