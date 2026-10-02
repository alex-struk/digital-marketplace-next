import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// scheduled-transition-trigger · default — requesting /status reports that the service is up, and the same request
// closes any published opportunity whose proposal deadline has passed (R-1.1)
const meta: Meta = { title: "opportunities/scheduled-transition-trigger/default" };
export default meta;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large" data-testid="service-status-page">
        <Heading level={1}>Service status</Heading>
        <Text elementType="p" data-testid="service-status-message">The Digital Marketplace is up.</Text>
      </Stack>
    </PageContainer>
  ),
};
