import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// opportunity-list · loading — the list has not arrived yet
const meta: Meta = { title: "opportunities/opportunity-list/loading" };
export default meta;

export const Loading: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Opportunities</Heading>
        <Stack direction="row" align="center" gap="small" role="status">
          <ProgressCircle isIndeterminate aria-label="Loading opportunities" />
          <Text>Loading opportunities…</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
