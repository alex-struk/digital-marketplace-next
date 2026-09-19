import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// notification-email-reference · not-found — anybody who is not an administrator, signed in or not, asks for the page.
// It is refused (R-6.13 note) with the shared missing page, which never says "not allowed" and so does not reveal
// that the page exists. What a refusal shows is not stated (DESIGN.md, notifications gap 10).
const meta: Meta = { title: "notifications/notification-email-reference/not-found" };
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
