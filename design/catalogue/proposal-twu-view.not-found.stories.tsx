import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-twu-view · not-found — a proposal this reader may not see: the opportunity has not closed yet, the proposal
// is a draft, or it is another vendor's (R-2.24, R-2.25)
const meta: Meta = { title: "proposals/proposal-twu-view/not-found" };
export default meta;

export const NotFound: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large" data-testid="not-found-page">
        <Heading level={1}>Page not found</Heading>
        <Text elementType="p">The page you are looking for does not exist.</Text>
        <div>
          <Link href="/" isButton buttonVariant="primary">Back to home</Link>
        </div>
      </Stack>
    </PageContainer>
  ),
};
