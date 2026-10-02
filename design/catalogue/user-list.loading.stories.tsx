import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// user-list · loading — the list of accounts has not arrived yet (R-4.14)
const meta: Meta = { title: "users/user-list/loading" };
export default meta;

export const Loading: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Digital Marketplace Users</Heading>
        <Stack direction="row" gap="small" align="center" role="status">
          <ProgressCircle isIndeterminate aria-label="Loading users" />
          <Text>Loading users…</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
