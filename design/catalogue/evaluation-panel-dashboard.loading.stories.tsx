import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// evaluation-panel-dashboard · loading — the lists have not arrived yet
const meta: Meta = { title: "evaluation/evaluation-panel-dashboard/loading" };
export default meta;

export const Loading: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Dashboard</Heading>
        <Stack direction="row" align="center" gap="small" role="status">
          <ProgressCircle isIndeterminate aria-label="Loading your opportunities" />
          <Text>Loading your opportunities…</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
