import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// home · default — a visitor who has not signed in; the awarded figures are illustrative, no criterion defines them
const meta: Meta = { title: "opportunities/home-page/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--layout-margin-medium)" } as const;
const facts = { display: "flex", flexWrap: "wrap", gap: "var(--layout-margin-large)", margin: "var(--layout-margin-none)" } as const;
const fact = { display: "grid", gap: "var(--layout-margin-xsmall)" } as const;
const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const figure = { margin: "var(--layout-margin-none)", font: "var(--typography-regular-display)" } as const;

export const Default: StoryObj = {
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
        <dl style={facts}>
          <div style={fact}>
            <dt style={term}>Opportunities awarded</dt>
            <dd style={figure} data-testid="home-awarded-count">128</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Total value awarded</dt>
            <dd style={figure} data-testid="home-awarded-value">$6,420,000</dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="home-programs-heading" style={stack}>
        <Heading level={2} id="home-programs-heading">The three programs</Heading>
        <ul>
          <li><Link href="/learn-more/code-with-us">Learn about Code With Us</Link></li>
          <li><Link href="/learn-more/sprint-with-us">Learn about Sprint With Us</Link></li>
          <li><Link href="/learn-more/team-with-us">Learn about Team With Us</Link></li>
        </ul>
      </section>
    </div>
  ),
};
