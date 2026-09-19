import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";

// scheduled-transition-trigger · default — requesting /status reports that the service is up, and the same request
// closes any published opportunity whose proposal deadline has passed (R-1.1)
const meta: Meta = { title: "opportunities/scheduled-transition-trigger/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;

export const Default: StoryObj = {
  render: () => (
    <div style={page} data-testid="service-status-page">
      <Heading level={1}>Service status</Heading>
      <Text elementType="p" data-testid="service-status-message">The Digital Marketplace is up.</Text>
    </div>
  ),
};
