import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// opportunity-cwu-complete · loading — the report has not arrived yet
const meta: Meta = { title: "opportunities/opportunity-cwu-complete/loading" };
export default meta;

export const Loading: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Code With Us opportunity report</Heading>
        <Stack direction="row" align="center" gap="small" role="status">
          <ProgressCircle isIndeterminate aria-label="Loading report" />
          <Text>Loading report…</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
