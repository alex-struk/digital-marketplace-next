import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";

// content-list · loading — an administrator opened the content area and the list of pages has not arrived (R-7.5)
const meta: Meta = { title: "content/content-list/loading" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const row = { display: "flex", alignItems: "center", gap: "var(--layout-margin-small)" } as const;

export const Loading: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Content Management</Heading>
      <div style={row} role="status">
        <ProgressCircle isIndeterminate aria-label="Loading pages" />
        <Text>Loading pages…</Text>
      </div>
    </div>
  ),
};
