import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";

// user-sign-out · loading — the sign-out request is still in progress (R-4.17)
const meta: Meta = { title: "users/user-sign-out/loading" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const row = { display: "flex", alignItems: "center", gap: "var(--layout-margin-small)" } as const;

export const Loading: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Signing Out</Heading>
      <div style={row} role="status">
        <ProgressCircle isIndeterminate aria-label="Signing out" />
        <Text>Signing you out…</Text>
      </div>
    </div>
  ),
};
