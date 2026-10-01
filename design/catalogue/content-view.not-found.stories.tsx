import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// content-view · not-found — no page holds the address ("nothing-here"), or the address is not well formed
// ("Not_A_Slug"). A person browsing sees the shared missing page either way, and no page content (R-7.2, R-7.3).
const meta: Meta = { title: "content/content-view/not-found" };
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
