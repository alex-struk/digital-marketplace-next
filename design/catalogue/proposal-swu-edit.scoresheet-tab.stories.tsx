import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, Link, Text } from "@bcgov/design-system-react-components";

// proposal-swu-edit · scoresheet-tab — the opportunity was awarded to another proponent, so this proposal is not
// awarded and the Scoresheet tab appears: each stage's score, the price score, the weighted total, the rank, and the
// anonymous name evaluators saw (R-2.5, R-2.30, R-2.31, R-2.32, R-2.33)
const meta: Meta = { title: "proposals/proposal-swu-edit/scoresheet-tab" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const facts = { display: "flex", flexWrap: "wrap", gap: "var(--layout-margin-large)", margin: "var(--layout-margin-none)" } as const;
const fact = { display: "grid", gap: "var(--layout-margin-xsmall)" } as const;
const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { margin: "var(--layout-margin-none)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const tabs = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--layout-margin-large)",
  listStyle: "none",
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-none)",
} as const;
const base = "/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000211";

export const ScoresheetTab: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a Sprint With Us proposal</Text>
      <Heading level={1}>Modernize the licence renewal service</Heading>
      <dl style={facts}>
        <div style={fact}>
          <dt style={term}>Status</dt>
          <dd style={detail}><span style={badge} data-testid="proposal-status">Not awarded</span></dd>
        </div>
        <div style={fact}>
          <dt style={term}>Proposal ID</dt>
          <dd style={detail} data-testid="proposal-identifier">3f8a2c10-6d4b-4e19-a7c5-000000000211</dd>
        </div>
        <div style={fact}>
          <dt style={term}>Opportunity ID</dt>
          <dd style={detail} data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000201</dd>
        </div>
      </dl>
      <div data-testid="proposal-actions">
        <ButtonGroup ariaLabel="Proposal actions">
          <Button variant="secondary" danger data-testid="proposal-withdraw-button">Withdraw</Button>
        </ButtonGroup>
      </div>
      <nav aria-label="Proposal sections">
        <ul style={tabs}>
          <li><Link href={`${base}/edit?tab=proposal`} data-testid="proposal-tab-proposal">Proposal</Link></li>
          <li><Link href={`${base}/edit?tab=scoresheet`} aria-current="page" data-testid="proposal-tab-scoresheet">Scoresheet</Link></li>
          <li><Link href={`${base}/edit?tab=history`} data-testid="proposal-tab-history">History</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Scoresheet</Heading>
        <Text elementType="p">
          During evaluation, evaluators saw this proposal as <span data-testid="proposal-anonymous-name">Proponent 2</span>.
        </Text>
        <dl style={facts}>
          <div style={fact}>
            <dt style={term}>Team questions</dt>
            <dd style={detail}>76.50%</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Code challenge</dt>
            <dd style={detail}>81%</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Team scenario</dt>
            <dd style={detail}>79%</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Price</dt>
            <dd style={detail}>95.65%</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Total</dt>
            <dd style={detail} data-testid="proposal-total-score">82.14%</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Rank</dt>
            <dd style={detail} data-testid="proposal-rank">2 of 3</dd>
          </div>
        </dl>
        <Text elementType="p" size="small" color="secondary">
          The total combines each stage's score in the proportions the opportunity states. The price score is this
          proposal's share of the lowest bid still in contention.
        </Text>
      </section>
    </div>
  ),
};
