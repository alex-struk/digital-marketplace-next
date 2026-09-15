import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";

// user-list · loading — the list of accounts has not arrived yet (R-4.14)
const meta: Meta = { title: "users/user-list/loading" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const row = { display: "flex", alignItems: "center", gap: "var(--layout-margin-small)" } as const;

export const Loading: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Digital Marketplace Users</Heading>
      <div style={row} role="status">
        <ProgressCircle isIndeterminate aria-label="Loading users" />
        <Text>Loading users…</Text>
      </div>
    </div>
  ),
};
