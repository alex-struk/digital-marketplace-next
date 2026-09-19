import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";

// notification-unsubscribe-landing · loading — the signed-in account has not arrived yet. The question is not asked
// until it has, because the question must name the signed-in person's own address (R-6.7).
const meta: Meta = { title: "notifications/notification-unsubscribe-landing/loading" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const row = { display: "flex", alignItems: "center", gap: "var(--layout-margin-small)" } as const;

export const Loading: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Notifications</Heading>
      <div style={row} role="status">
        <ProgressCircle isIndeterminate aria-label="Loading your notification settings" />
        <Text>Loading your notification settings…</Text>
      </div>
    </div>
  ),
};
