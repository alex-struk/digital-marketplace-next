import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-twu-edit · scoresheet-tab — the opportunity was awarded to this proposal, so the Scoresheet tab appears:
// each stage's score, the price score, the weighted total, the rank, and the anonymous name evaluators saw (R-2.5,
// R-2.30, R-2.31, R-2.32, R-2.33)
const meta: Meta = { title: "proposals/proposal-twu-edit/scoresheet-tab" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const base = "/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000311";

export const ScoresheetTab: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Manage a Team With Us proposal</Text>
          <Heading level={1}>Data platform team</Heading>
        </Stack>
        <Stack as="dl" direction="row" gap="medium">
          <Stack gap="small">
            <dt style={term}>Status</dt>
            <dd><span style={badge} data-testid="proposal-status">Awarded</span></dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Proposal ID</dt>
            <dd data-testid="proposal-identifier">3f8a2c10-6d4b-4e19-a7c5-000000000311</dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Opportunity ID</dt>
            <dd data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000301</dd>
          </Stack>
        </Stack>
        <div data-testid="proposal-actions">
          <ButtonGroup ariaLabel="Proposal actions">
            <Button variant="secondary" danger data-testid="proposal-withdraw-button">Withdraw</Button>
          </ButtonGroup>
        </div>
        <nav aria-label="Proposal sections">
          <Stack as="ul" direction="row" gap="medium">
            <li><Link href={`${base}/edit?tab=proposal`} data-testid="proposal-tab-proposal">Proposal</Link></li>
            <li><Link href={`${base}/edit?tab=scoresheet`} aria-current="page" data-testid="proposal-tab-scoresheet">Scoresheet</Link></li>
            <li><Link href={`${base}/edit?tab=history`} data-testid="proposal-tab-history">History</Link></li>
          </Stack>
        </nav>
        <Stack as="section" gap="medium" aria-labelledby="tab-heading">
          <Heading level={2} id="tab-heading">Scoresheet</Heading>
          <Text elementType="p">
            During evaluation, evaluators saw this proposal as <span data-testid="proposal-anonymous-name">Proponent 1</span>.
          </Text>
          <Stack as="dl" direction="row" gap="medium">
            <Stack gap="small">
              <dt style={term}>Resource questions</dt>
              <dd>84%</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Challenge</dt>
              <dd>85%</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Price</dt>
              <dd>100%</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Total</dt>
              <dd data-testid="proposal-total-score">88.10%</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Rank</dt>
              <dd data-testid="proposal-rank">1 of 2</dd>
            </Stack>
          </Stack>
          <Text elementType="p" size="small" color="secondary">
            The total combines each stage's score in the proportions the opportunity states. The price score is this
            proposal's share of the lowest bid still in contention.
          </Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
