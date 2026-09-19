import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// evaluation-individual-edit-swu · not-found — anyone not allowed to read this evaluation, which always includes a public
// sector employee with no connection to the opportunity (R-5.11). Who else is shut out before consensus is disputed
// between R-5.11 and R-5.28 (gap 3)
const meta: Meta = { title: "evaluation/evaluation-individual-edit-swu/not-found" };
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
