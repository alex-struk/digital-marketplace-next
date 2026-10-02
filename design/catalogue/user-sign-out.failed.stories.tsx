import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, InlineAlert } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// user-sign-out · failed — the session could not be ended (R-4.17)
const meta: Meta = { title: "users/user-sign-out/failed" };
export default meta;

export const Failed: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Sign Out Failed</Heading>
        <div data-testid="sign-out-failed">
          <InlineAlert
            variant="danger"
            role="alert"
            title="We could not sign you out"
            description="You may still be signed in. Try signing out again."
          />
        </div>
      </Stack>
    </PageContainer>
  ),
};
