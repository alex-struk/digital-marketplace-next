import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-swu-view · evaluated — every stage has a score, so the price score and the weighted total are shown, the
// proposal is ranked among the other fully evaluated proposals, and it may be awarded (R-2.30, R-2.31, R-2.33)
const meta: Meta = { title: "proposals/proposal-swu-view/evaluated" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const base = "/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000211";

export const Evaluated: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Sprint With Us proposal</Text>
          <Heading level={1}><span data-testid="proposal-proponent-name">Example Digital Ltd.</span></Heading>
        </Stack>
        <Stack as="dl" direction="row" gap="medium">
          <Stack gap="small">
            <dt style={term}>Opportunity</dt>
            <dd><Link href="/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/edit">Modernize the licence renewal service</Link></dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Status</dt>
            <dd><span style={badge} data-testid="proposal-status">Evaluated</span></dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Proposal ID</dt>
            <dd data-testid="proposal-identifier">3f8a2c10-6d4b-4e19-a7c5-000000000211</dd>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="scores-heading">
          <Heading level={2} id="scores-heading">Scores</Heading>
          <Stack as="dl" direction="row" gap="medium">
            <Stack gap="small">
              <dt style={term}>Team questions</dt>
              <dd data-testid="proposal-questions-score">82.50%</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Code challenge</dt>
              <dd data-testid="proposal-challenge-score">90%</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Team scenario</dt>
              <dd data-testid="proposal-scenario-score">88%</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Price</dt>
              <dd data-testid="proposal-price-score">95.65%</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Total</dt>
              <dd data-testid="proposal-total-score">88.41%</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Rank</dt>
              <dd data-testid="proposal-rank">1 of 3</dd>
            </Stack>
          </Stack>
          <Text elementType="p" size="small" color="secondary">
            The total combines each stage's score in the proportions the opportunity states. The price score is this
            proposal's share of the lowest bid still in contention.
          </Text>
        </Stack>
        <div>
          <Link href={`${base}/export`} data-testid="proposal-export-link">Printable copy</Link>
        </div>
        <div data-testid="proposal-actions">
          <ButtonGroup ariaLabel="Proposal actions">
            <Button variant="primary" data-testid="proposal-award-button">Award</Button>
            <Button variant="secondary" danger data-testid="proposal-disqualify-button">Disqualify</Button>
          </ButtonGroup>
        </div>
        <nav aria-label="Proposal sections">
          <Stack as="ul" direction="row" gap="medium">
            <li><Link href={`${base}?tab=proposal`} aria-current="page" data-testid="proposal-tab-proposal">Proposal</Link></li>
            <li><Link href={`${base}?tab=teamQuestions`} data-testid="proposal-tab-team-questions">Team questions</Link></li>
            <li><Link href={`${base}?tab=codeChallenge`} data-testid="proposal-tab-code-challenge">Code challenge</Link></li>
            <li><Link href={`${base}?tab=teamScenario`} data-testid="proposal-tab-team-scenario">Team scenario</Link></li>
            <li><Link href={`${base}?tab=history`} data-testid="proposal-tab-history">History</Link></li>
          </Stack>
        </nav>
        <Stack as="section" gap="medium" aria-labelledby="tab-heading">
          <Heading level={2} id="tab-heading">Proposal</Heading>
          <Text elementType="p" size="small" color="secondary">
            The proposal is shown as in the default story, now naming the organization. It is trimmed here.
          </Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
