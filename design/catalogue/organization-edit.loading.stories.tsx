import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// organization-edit · loading — the organization has not arrived yet, so its name is not known and the surface
// title stands in as the H1 (R-3.3)
const meta: Meta = { title: "organizations/organization-edit/loading" };
export default meta;

export const Loading: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Edit Organization</Heading>
        <Stack direction="row" gap="small" align="center" role="status">
          <ProgressCircle isIndeterminate aria-label="Loading organization" />
          <Text>Loading organization…</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
