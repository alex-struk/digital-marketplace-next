import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// content-edit · loading — the managing screen has been opened and the page has not arrived. The surface title stands in
// for the H1 until the page's own title is known.
const meta: Meta = { title: "content/content-edit/loading" };
export default meta;

export const Loading: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Manage a page</Heading>
        <Stack direction="row" align="center" gap="small" role="status">
          <ProgressCircle isIndeterminate aria-label="Loading page" />
          <Text>Loading page…</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
