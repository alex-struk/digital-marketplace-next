import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";

// evaluation-panel-twu · loading — the panel has not arrived yet
const meta: Meta = { title: "evaluation/evaluation-panel-twu/loading" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const statusRow = { display: "flex", alignItems: "center", gap: "var(--layout-margin-small)" } as const;

export const Loading: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Manage a Team With Us opportunity</Heading>
      <div style={statusRow} role="status">
        <ProgressCircle isIndeterminate aria-label="Loading evaluation panel" />
        <Text>Loading evaluation panel…</Text>
      </div>
    </div>
  ),
};
