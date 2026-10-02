import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// organization-list · loading — the page of organizations has not arrived yet (R-3.1)
const meta: Meta = { title: "organizations/organization-list/loading" };
export default meta;

export const Loading: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Digital Marketplace Organizations</Heading>
        <Stack direction="row" align="center" gap="small" role="status">
          <ProgressCircle isIndeterminate aria-label="Loading organizations" />
          <Text>Loading organizations…</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
