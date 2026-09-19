import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// proposal-swu-export-all · not-found — a vendor or a visitor opens the address. Only public sector staff and
// administrators may take every proposal away (R-2.38)
const meta: Meta = { title: "proposals/proposal-swu-export-all/not-found" };
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
