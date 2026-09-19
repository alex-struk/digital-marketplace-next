import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";

// proposal-swu-export-all · loading — the proposals have not arrived yet
const meta: Meta = { title: "proposals/proposal-swu-export-all/loading" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const statusRow = { display: "flex", alignItems: "center", gap: "var(--layout-margin-small)" } as const;

export const Loading: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Export all Sprint With Us proposals</Heading>
      <div style={statusRow} role="status">
        <ProgressCircle isIndeterminate aria-label="Loading proposals" />
        <Text>Loading proposals…</Text>
      </div>
    </div>
  ),
};
