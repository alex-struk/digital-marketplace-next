import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";

// organization-list · loading — the page of organizations has not arrived yet (R-3.1)
const meta: Meta = { title: "organizations/organization-list/loading" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const row = { display: "flex", alignItems: "center", gap: "var(--layout-margin-small)" } as const;

export const Loading: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Digital Marketplace Organizations</Heading>
      <div style={row} role="status">
        <ProgressCircle isIndeterminate aria-label="Loading organizations" />
        <Text>Loading organizations…</Text>
      </div>
    </div>
  ),
};
