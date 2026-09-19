import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";

// proposal-vendor-dashboard · loading — the vendor's proposals have not arrived yet
const meta: Meta = { title: "proposals/proposal-vendor-dashboard/loading" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const statusRow = { display: "flex", alignItems: "center", gap: "var(--layout-margin-small)" } as const;

export const Loading: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Dashboard</Heading>
      <div style={statusRow} role="status">
        <ProgressCircle isIndeterminate aria-label="Loading your proposals" />
        <Text>Loading your proposals…</Text>
      </div>
    </div>
  ),
};
