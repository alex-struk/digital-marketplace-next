import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// evaluation-consensus-create-swu · not-found — anyone not on the panel, and anyone at all while the opportunity is not
// in consensus (R-5.28, R-5.29). A panel member who is not the chair sees the chair-only story instead
const meta: Meta = { title: "evaluation/evaluation-consensus-create-swu/not-found" };
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
