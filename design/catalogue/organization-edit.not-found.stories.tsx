import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// organization-edit · not-found — an ordinary member, public sector staff, or anyone else who neither owns nor
// administers the organization nor is a service administrator; also an archived or unknown organization (R-3.3)
const meta: Meta = { title: "organizations/organization-edit/not-found" };
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
