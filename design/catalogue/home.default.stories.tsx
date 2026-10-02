import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// home · default — a visitor who has not signed in; the awarded figures are illustrative, no criterion defines them
const meta: Meta = { title: "opportunities/home-page/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const figure = { font: "var(--typography-regular-display)" } as const;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large" data-testid="home-page">
        <Heading level={1}>Digital Marketplace</Heading>
        <Text elementType="p" size="large">
          The Digital Marketplace is where the BC Public Service posts procurement opportunities for digital work, and where
          vendors propose to do that work, through three programs: Code With Us, Sprint With Us and Team With Us.
        </Text>
        <Stack direction="row" align="center" gap="medium">
          <Link href="/opportunities" isButton buttonVariant="primary" data-testid="home-browse-opportunities">Browse opportunities</Link>
          <Link href="/sign-in" isButton buttonVariant="secondary" data-testid="home-sign-in">Sign in</Link>
          <Link href="/sign-up" isButton buttonVariant="tertiary" data-testid="home-sign-up">Sign up</Link>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="home-awards-heading">
          <Heading level={2} id="home-awards-heading">Awarded through the Digital Marketplace</Heading>
          <Stack as="dl" direction="row" gap="medium">
            <Stack gap="small">
              <dt style={term}>Opportunities awarded</dt>
              <dd style={figure} data-testid="home-awarded-count">128</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Total value awarded</dt>
              <dd style={figure} data-testid="home-awarded-value">$6,420,000</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="home-programs-heading">
          <Heading level={2} id="home-programs-heading">The three programs</Heading>
          <ul>
            <li><Link href="/learn-more/code-with-us">Learn about Code With Us</Link></li>
            <li><Link href="/learn-more/sprint-with-us">Learn about Sprint With Us</Link></li>
            <li><Link href="/learn-more/team-with-us">Learn about Team With Us</Link></li>
          </ul>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
