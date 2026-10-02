import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-cwu-edit · awarded — the opportunity has been awarded to this proposal, so its score and rank are now shown
// to the vendor. A proposal that was passed over shows "Not awarded" with its score and rank in the same place (R-2.26,
// R-2.32, R-2.33)
const meta: Meta = { title: "proposals/proposal-cwu-edit/awarded" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const base = "/opportunities/code-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000101/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000111";

export const Awarded: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Manage a Code With Us proposal</Text>
          <Heading level={1}>Build an accessible permit tracker</Heading>
        </Stack>
        <Stack as="dl" direction="row" gap="medium">
          <Stack gap="small">
            <dt style={term}>Status</dt>
            <dd><span style={badge} data-testid="proposal-status">Awarded</span></dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Submitted</dt>
            <dd data-testid="proposal-submitted-at">September 15, 2026 at 2:12 p.m.</dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Proposal ID</dt>
            <dd data-testid="proposal-identifier">3f8a2c10-6d4b-4e19-a7c5-000000000111</dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Opportunity ID</dt>
            <dd data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000101</dd>
          </Stack>
        </Stack>
        <div data-testid="proposal-actions">
          <ButtonGroup ariaLabel="Proposal actions">
            <Button variant="secondary" danger data-testid="proposal-withdraw-button">Withdraw</Button>
          </ButtonGroup>
        </div>
        <nav aria-label="Proposal sections">
          <Stack as="ul" direction="row" gap="medium">
            <li><Link href={`${base}/edit?tab=proposal`} aria-current="page" data-testid="proposal-tab-proposal">Proposal</Link></li>
            <li><Link href={`${base}/edit?tab=history`} data-testid="proposal-tab-history">History</Link></li>
          </Stack>
        </nav>
        <Stack as="section" gap="medium" aria-labelledby="tab-heading">
          <Heading level={2} id="tab-heading">Proposal</Heading>
          <Stack as="section" gap="medium" aria-labelledby="tab-result">
            <Heading level={3} id="tab-result">Result</Heading>
            <Stack as="dl" direction="row" gap="medium">
              <Stack gap="small">
                <dt style={term}>Score</dt>
                <dd data-testid="proposal-score">87%</dd>
              </Stack>
              <Stack gap="small">
                <dt style={term}>Rank</dt>
                <dd data-testid="proposal-rank">1 of 2</dd>
              </Stack>
            </Stack>
          </Stack>
          <Text elementType="p" size="small" color="secondary">
            The proponent, proposal, comments and attachments follow, as in the default story. They are trimmed here.
          </Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
