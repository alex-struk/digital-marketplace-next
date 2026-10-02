import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-vendor-dashboard · loading — the vendor's proposals have not arrived yet
const meta: Meta = { title: "proposals/proposal-vendor-dashboard/loading" };
export default meta;

export const Loading: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Dashboard</Heading>
        <Stack direction="row" align="center" gap="small" role="status">
          <ProgressCircle isIndeterminate aria-label="Loading your proposals" />
          <Text>Loading your proposals…</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
