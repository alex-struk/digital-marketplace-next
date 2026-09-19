import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";

// notification-email-reference · loading — an administrator has opened the page and the sample messages are still
// being composed. The heading and the page wrapper render at once.
const meta: Meta = { title: "notifications/notification-email-reference/loading" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const row = { display: "flex", alignItems: "center", gap: "var(--layout-margin-small)" } as const;

export const Loading: StoryObj = {
  render: () => (
    <div style={page} data-testid="email-reference-page">
      <Heading level={1}>Email Notification Reference</Heading>
      <div style={row} role="status">
        <ProgressCircle isIndeterminate aria-label="Loading sample emails" />
        <Text>Loading sample emails…</Text>
      </div>
    </div>
  ),
};
