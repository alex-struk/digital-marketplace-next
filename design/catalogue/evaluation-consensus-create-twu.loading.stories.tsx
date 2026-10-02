import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// evaluation-consensus-create-twu · loading — the proponent and the evaluators' scores have not arrived yet
const meta: Meta = { title: "evaluation/evaluation-consensus-create-twu/loading" };
export default meta;

export const Loading: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Agree a Team With Us consensus</Heading>
        <Stack direction="row" align="center" gap="small" role="status">
          <ProgressCircle isIndeterminate aria-label="Loading the evaluators' scores" />
          <Text>Loading the evaluators' scores…</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
