import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, Link, Text } from "@bcgov/design-system-react-components";

// proposal-cwu-view · evaluated — the proposal has been scored, so it is evaluated, it has a rank among the other
// evaluated proposals, and it may be awarded. When every proposal still in contention is evaluated, the opportunity
// moves to processing on its own (R-2.26, R-2.27, R-2.31, R-2.33)
const meta: Meta = { title: "proposals/proposal-cwu-view/evaluated" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const tight = { display: "grid", gap: "var(--layout-margin-small)" } as const;
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
const base = "/opportunities/code-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000101/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000111";

export const Evaluated: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Code With Us proposal</Text>
      <Heading level={1}><span data-testid="proposal-proponent-name">Test Vendor</span></Heading>
      <dl style={facts}>
        <div style={fact}>
          <dt style={term}>Opportunity</dt>
          <dd style={detail}><Link href="/opportunities/code-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000101/edit">Build an accessible permit tracker</Link></dd>
        </div>
        <div style={fact}>
          <dt style={term}>Status</dt>
          <dd style={detail}><span style={badge} data-testid="proposal-status">Evaluated</span></dd>
        </div>
        <div style={fact}>
          <dt style={term}>Submitted</dt>
          <dd style={detail}>September 15, 2026 at 2:12 p.m.</dd>
        </div>
        <div style={fact}>
          <dt style={term}>Proposal ID</dt>
          <dd style={detail} data-testid="proposal-identifier">3f8a2c10-6d4b-4e19-a7c5-000000000111</dd>
        </div>
      </dl>
      <section aria-labelledby="scores-heading" style={tight}>
        <Heading level={2} id="scores-heading">Score</Heading>
        <dl style={facts}>
          <div style={fact}>
            <dt style={term}>Score</dt>
            <dd style={detail} data-testid="proposal-score">87%</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Rank</dt>
            <dd style={detail} data-testid="proposal-rank">1 of 2</dd>
          </div>
        </dl>
      </section>
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
        <ul style={tabs}>
          <li><Link href={`${base}?tab=proposal`} aria-current="page" data-testid="proposal-tab-proposal">Proposal</Link></li>
          <li><Link href={`${base}?tab=history`} data-testid="proposal-tab-history">History</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Proposal</Heading>
        <Text elementType="p" size="small" color="secondary">The proposal is shown as in the default story and is trimmed here.</Text>
      </section>
    </div>
  ),
};
