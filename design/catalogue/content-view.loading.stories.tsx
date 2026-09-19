import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressCircle, Text } from "@bcgov/design-system-react-components";

// content-view · loading — the page has been asked for and has not arrived. Its title is the page's own, so nothing
// stands in for the H1 until it arrives; the status row says what is happening (R-7.1).
const meta: Meta = { title: "content/content-view/loading" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const row = { display: "flex", alignItems: "center", gap: "var(--layout-margin-small)" } as const;

export const Loading: StoryObj = {
  render: () => (
    <div style={page}>
      <div style={row} role="status">
        <ProgressCircle isIndeterminate aria-label="Loading page" />
        <Text>Loading page…</Text>
      </div>
    </div>
  ),
};
