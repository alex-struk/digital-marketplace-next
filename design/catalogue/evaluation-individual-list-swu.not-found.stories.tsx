import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// evaluation-individual-list-swu · not-found — the address opened by anyone who is not an evaluator on the panel. The
// Evaluation tab is never offered to them (R-5.21, R-5.34); answering the address as missing follows R-5.18 (see gap 5)
const meta: Meta = { title: "evaluation/evaluation-individual-list-swu/not-found" };
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
