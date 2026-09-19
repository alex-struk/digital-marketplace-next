import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// evaluation-consensus-edit-twu · not-found — anyone but the chair who recorded it, and anyone at all once the opportunity
// has left consensus. An administrator reads the agreed scores on the Consensus tab (R-5.28, R-5.29, R-5.30; gap 11)
const meta: Meta = { title: "evaluation/evaluation-consensus-edit-twu/not-found" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;

export const NotFound: StoryObj = {
  render: () => (
    <div style={page} data-testid="not-found-page">
      <Heading level={1}>Page not found</Heading>
      <Text elementType="p">The page you are looking for does not exist.</Text>
      <div>
        <Link href="/" isButton buttonVariant="primary">Back to home</Link>
      </div>
    </div>
  ),
};
