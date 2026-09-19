import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";

// organization-edit · loading — the organization has not arrived yet, so its name is not known and the surface
// title stands in as the H1 (R-3.3)
const meta: Meta = { title: "organizations/organization-edit/loading" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const row = { display: "flex", alignItems: "center", gap: "var(--layout-margin-small)" } as const;

export const Loading: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Edit Organization</Heading>
      <div style={row} role="status">
        <ProgressCircle isIndeterminate aria-label="Loading organization" />
        <Text>Loading organization…</Text>
      </div>
    </div>
  ),
};
