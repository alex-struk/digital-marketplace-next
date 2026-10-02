import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-cwu-view · evaluated — the proposal has been scored, so it is evaluated, it has a rank among the other
// evaluated proposals, and it may be awarded. When every proposal still in contention is evaluated, the opportunity
// moves to processing on its own (R-2.26, R-2.27, R-2.31, R-2.33)
const meta: Meta = { title: "proposals/proposal-cwu-view/evaluated" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const base = "/opportunities/code-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000101/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000111";

export const Evaluated: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Code With Us proposal</Text>
          <Heading level={1}><span data-testid="proposal-proponent-name">Test Vendor</span></Heading>
        </Stack>
        <Stack as="dl" direction="row" gap="medium">
          <Stack gap="small">
            <dt style={term}>Opportunity</dt>
            <dd><Link href="/opportunities/code-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000101/edit">Build an accessible permit tracker</Link></dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Status</dt>
            <dd><span style={badge} data-testid="proposal-status">Evaluated</span></dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Submitted</dt>
            <dd>September 15, 2026 at 2:12 p.m.</dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Proposal ID</dt>
            <dd data-testid="proposal-identifier">3f8a2c10-6d4b-4e19-a7c5-000000000111</dd>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="scores-heading">
          <Heading level={2} id="scores-heading">Score</Heading>
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
            <li><Link href={`${base}?tab=history`} data-testid="proposal-tab-history">History</Link></li>
          </Stack>
        </nav>
        <Stack as="section" gap="medium" aria-labelledby="tab-heading">
          <Heading level={2} id="tab-heading">Proposal</Heading>
          <Text elementType="p" size="small" color="secondary">The proposal is shown as in the default story and is trimmed here.</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
