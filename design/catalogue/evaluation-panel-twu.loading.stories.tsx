import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// evaluation-panel-twu · loading — the panel has not arrived yet
const meta: Meta = { title: "evaluation/evaluation-panel-twu/loading" };
export default meta;

export const Loading: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Manage a Team With Us opportunity</Heading>
        <Stack direction="row" align="center" gap="small" role="status">
          <ProgressCircle isIndeterminate aria-label="Loading evaluation panel" />
          <Text>Loading evaluation panel…</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
