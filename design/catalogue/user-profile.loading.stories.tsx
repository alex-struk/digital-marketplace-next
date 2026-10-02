import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// user-profile · loading — the account record has not arrived yet (R-4.25)
const meta: Meta = { title: "users/user-profile/loading" };
export default meta;

export const Loading: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>User Profile</Heading>
        <Stack direction="row" gap="small" align="center" role="status">
          <ProgressCircle isIndeterminate aria-label="Loading profile" />
          <Text>Loading profile…</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
