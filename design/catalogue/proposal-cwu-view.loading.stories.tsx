import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-cwu-view · loading — the proposal has not arrived yet
const meta: Meta = { title: "proposals/proposal-cwu-view/loading" };
export default meta;

export const Loading: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Code With Us proposal</Heading>
        <Stack direction="row" align="center" gap="small" role="status">
          <ProgressCircle isIndeterminate aria-label="Loading proposal" />
          <Text>Loading proposal…</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
