import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// content-view · loading — the page has been asked for and has not arrived. Its title is the page's own, so nothing
// stands in for the H1 until it arrives; the status row says what is happening (R-7.1).
const meta: Meta = { title: "content/content-view/loading" };
export default meta;

export const Loading: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack direction="row" align="center" gap="small" role="status">
          <ProgressCircle isIndeterminate aria-label="Loading page" />
          <Text>Loading page…</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
