import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// evaluation-consensus-list-swu · loading — the consensus list has not arrived yet
const meta: Meta = { title: "evaluation/evaluation-consensus-list-swu/loading" };
export default meta;

export const Loading: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Manage a Sprint With Us opportunity</Heading>
        <Stack direction="row" align="center" gap="small" role="status">
          <ProgressCircle isIndeterminate aria-label="Loading consensus" />
          <Text>Loading consensus…</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
