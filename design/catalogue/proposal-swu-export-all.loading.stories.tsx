import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-swu-export-all · loading — the proposals have not arrived yet
const meta: Meta = { title: "proposals/proposal-swu-export-all/loading" };
export default meta;

export const Loading: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Export all Sprint With Us proposals</Heading>
        <Stack direction="row" align="center" gap="small" role="status">
          <ProgressCircle isIndeterminate aria-label="Loading proposals" />
          <Text>Loading proposals…</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
