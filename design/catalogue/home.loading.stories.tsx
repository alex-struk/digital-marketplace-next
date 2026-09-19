import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, ProgressCircle, Text } from "@bcgov/design-system-react-components";

// home · loading — the awarded figures have not arrived; everything else is already readable
const meta: Meta = { title: "opportunities/home-page/loading" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--layout-margin-medium)" } as const;
const statusRow = { display: "flex", alignItems: "center", gap: "var(--layout-margin-small)" } as const;

export const Loading: StoryObj = {
  render: () => (
    <div style={page} data-testid="home-page">
      <Heading level={1}>Digital Marketplace</Heading>
      <Text elementType="p" size="large">
        The Digital Marketplace is where the BC Public Service posts procurement opportunities for digital work, and where
        vendors propose to do that work, through three programs: Code With Us, Sprint With Us and Team With Us.
      </Text>
      <div style={row}>
        <Link href="/opportunities" isButton buttonVariant="primary" data-testid="home-browse-opportunities">Browse opportunities</Link>
        <Link href="/sign-in" isButton buttonVariant="secondary" data-testid="home-sign-in">Sign in</Link>
        <Link href="/sign-up" isButton buttonVariant="tertiary" data-testid="home-sign-up">Sign up</Link>
      </div>
      <section aria-labelledby="home-awards-heading" style={stack}>
        <Heading level={2} id="home-awards-heading">Awarded through the Digital Marketplace</Heading>
        <div style={statusRow} role="status">
          <ProgressCircle isIndeterminate aria-label="Loading figures" />
          <Text>Loading figures…</Text>
        </div>
      </section>
    </div>
  ),
};
