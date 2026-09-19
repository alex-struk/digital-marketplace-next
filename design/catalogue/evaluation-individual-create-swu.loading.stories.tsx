import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, ProgressCircle, Text } from "@bcgov/design-system-react-components";

// evaluation-individual-create-swu · loading — the proponent's responses have not arrived yet
const meta: Meta = { title: "evaluation/evaluation-individual-create-swu/loading" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const statusRow = { display: "flex", alignItems: "center", gap: "var(--layout-margin-small)" } as const;

export const Loading: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Evaluate a Sprint With Us proponent</Heading>
      <div style={statusRow} role="status">
        <ProgressCircle isIndeterminate aria-label="Loading the proponent's responses" />
        <Text>Loading the proponent's responses…</Text>
      </div>
    </div>
  ),
};
