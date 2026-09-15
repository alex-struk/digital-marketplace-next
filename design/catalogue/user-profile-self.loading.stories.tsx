import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";

// user-profile-self · loading — the signed-in person's record has not arrived yet (R-4.26)
const meta: Meta = { title: "users/user-profile-self/loading" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const row = { display: "flex", alignItems: "center", gap: "var(--layout-margin-small)" } as const;

export const Loading: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>User Profile</Heading>
      <div style={row} role="status">
        <ProgressCircle isIndeterminate aria-label="Loading your profile" />
        <Text>Loading your profile…</Text>
      </div>
    </div>
  ),
};
