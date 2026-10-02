import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// evaluation-individual-edit-twu · loading — the evaluation has not arrived yet
const meta: Meta = { title: "evaluation/evaluation-individual-edit-twu/loading" };
export default meta;

export const Loading: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Team With Us evaluation</Heading>
        <Stack direction="row" align="center" gap="small" role="status">
          <ProgressCircle isIndeterminate aria-label="Loading the evaluation" />
          <Text>Loading the evaluation…</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
