import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// evaluation-individual-create-twu · loading — the proponent's responses have not arrived yet
const meta: Meta = { title: "evaluation/evaluation-individual-create-twu/loading" };
export default meta;

export const Loading: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Evaluate a Team With Us proponent</Heading>
        <Stack direction="row" align="center" gap="small" role="status">
          <ProgressCircle isIndeterminate aria-label="Loading the proponent's responses" />
          <Text>Loading the proponent's responses…</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
