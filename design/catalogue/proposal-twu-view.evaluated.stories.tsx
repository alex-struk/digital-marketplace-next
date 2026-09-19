import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, Link, Text } from "@bcgov/design-system-react-components";

// proposal-twu-view · evaluated — every stage has a score, so the price score and the weighted total are shown, the
// proposal is ranked among the other fully evaluated proposals, and it may be awarded (R-2.30, R-2.31, R-2.33)
const meta: Meta = { title: "proposals/proposal-twu-view/evaluated" };
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
const base = "/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000311";

export const Evaluated: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Team With Us proposal</Text>
      <Heading level={1}><span data-testid="proposal-proponent-name">Example Digital Ltd.</span></Heading>
      <dl style={facts}>
        <div style={fact}>
          <dt style={term}>Opportunity</dt>
          <dd style={detail}><Link href="/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301/edit">Data platform team</Link></dd>
        </div>
        <div style={fact}>
          <dt style={term}>Status</dt>
          <dd style={detail}><span style={badge} data-testid="proposal-status">Evaluated</span></dd>
        </div>
        <div style={fact}>
          <dt style={term}>Proposal ID</dt>
          <dd style={detail} data-testid="proposal-identifier">3f8a2c10-6d4b-4e19-a7c5-000000000311</dd>
        </div>
      </dl>
      <section aria-labelledby="scores-heading" style={tight}>
        <Heading level={2} id="scores-heading">Scores</Heading>
        <dl style={facts}>
          <div style={fact}>
            <dt style={term}>Resource questions</dt>
            <dd style={detail} data-testid="proposal-questions-score">84%</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Challenge</dt>
            <dd style={detail} data-testid="proposal-challenge-score">85%</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Price</dt>
            <dd style={detail} data-testid="proposal-price-score">100%</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Total</dt>
            <dd style={detail} data-testid="proposal-total-score">88.10%</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Rank</dt>
            <dd style={detail} data-testid="proposal-rank">1 of 2</dd>
          </div>
        </dl>
        <Text elementType="p" size="small" color="secondary">
          The total combines each stage's score in the proportions the opportunity states. The price score is this
          proposal's share of the lowest bid still in contention, where a bid is each hourly rate weighted by its resource's
          target allocation.
        </Text>
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
          <li><Link href={`${base}?tab=resourceQuestions`} data-testid="proposal-tab-resource-questions">Resource questions</Link></li>
          <li><Link href={`${base}?tab=challenge`} data-testid="proposal-tab-challenge">Challenge</Link></li>
          <li><Link href={`${base}?tab=history`} data-testid="proposal-tab-history">History</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Proposal</Heading>
        <Text elementType="p" size="small" color="secondary">
          The proposal is shown as in the default story, now naming the organization. It is trimmed here.
        </Text>
      </section>
    </div>
  ),
};
