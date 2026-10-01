import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// content-create · not-found — anybody but an administrator opened /content/create directly and is shown the
// not-found screen (R-7.6, R-7.10)
const meta: Meta = { title: "content/content-create/not-found" };
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
