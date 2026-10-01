import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// content-list · loading — an administrator opened the content area and the list of pages has not arrived (R-7.5)
const meta: Meta = { title: "content/content-list/loading" };
export default meta;

export const Loading: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Content Management</Heading>
        <Stack direction="row" align="center" gap="small" role="status">
          <ProgressCircle isIndeterminate aria-label="Loading pages" />
          <Text>Loading pages…</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
