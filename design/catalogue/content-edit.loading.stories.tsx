import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";

// content-edit · loading — the managing screen has been opened and the page has not arrived. The surface title stands in
// for the H1 until the page's own title is known.
const meta: Meta = { title: "content/content-edit/loading" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const row = { display: "flex", alignItems: "center", gap: "var(--layout-margin-small)" } as const;

export const Loading: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Manage a page</Heading>
      <div style={row} role="status">
        <ProgressCircle isIndeterminate aria-label="Loading page" />
        <Text>Loading page…</Text>
      </div>
    </div>
  ),
};
