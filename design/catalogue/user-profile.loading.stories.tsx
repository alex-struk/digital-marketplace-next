import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";

// user-profile · loading — the account record has not arrived yet (R-4.25)
const meta: Meta = { title: "users/user-profile/loading" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const row = { display: "flex", alignItems: "center", gap: "var(--layout-margin-small)" } as const;

export const Loading: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>User Profile</Heading>
      <div style={row} role="status">
        <ProgressCircle isIndeterminate aria-label="Loading profile" />
        <Text>Loading profile…</Text>
      </div>
    </div>
  ),
};
