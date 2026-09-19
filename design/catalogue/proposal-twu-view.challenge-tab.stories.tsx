import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, Link, Text } from "@bcgov/design-system-react-components";

// proposal-twu-view · challenge-tab — the proposal reached the challenge, so the proponent is now named. Staff enter its
// challenge score here. Entering the last challenge score also calculates every proposal's price score (R-2.28, R-2.30,
// R-2.37)
const meta: Meta = { title: "proposals/proposal-twu-view/challenge-tab" };
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

export const ChallengeTab: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Team With Us proposal</Text>
      <Heading level={1}><span data-testid="proposal-proponent-name">Example Digital Ltd.</span></Heading>
      <Text elementType="p">Status: <span style={badge} data-testid="proposal-status">Under review: challenge</span></Text>
      <section aria-labelledby="scores-heading" style={tight}>
        <Heading level={2} id="scores-heading">Scores</Heading>
        <dl style={facts}>
          <div style={fact}>
            <dt style={term}>Resource questions</dt>
            <dd style={detail} data-testid="proposal-questions-score">84%</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Challenge</dt>
            <dd style={detail} data-testid="proposal-challenge-score">Not yet scored</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Price</dt>
            <dd style={detail} data-testid="proposal-price-score">Not yet calculated</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Total</dt>
            <dd style={detail} data-testid="proposal-total-score">Not yet calculated</dd>
          </div>
        </dl>
      </section>
      <div data-testid="proposal-actions">
        <ButtonGroup ariaLabel="Proposal actions">
          <Button variant="secondary" danger data-testid="proposal-disqualify-button">Disqualify</Button>
        </ButtonGroup>
      </div>
      <nav aria-label="Proposal sections">
        <ul style={tabs}>
          <li><Link href={`${base}?tab=proposal`} data-testid="proposal-tab-proposal">Proposal</Link></li>
          <li><Link href={`${base}?tab=resourceQuestions`} data-testid="proposal-tab-resource-questions">Resource questions</Link></li>
          <li><Link href={`${base}?tab=challenge`} aria-current="page" data-testid="proposal-tab-challenge">Challenge</Link></li>
          <li><Link href={`${base}?tab=history`} data-testid="proposal-tab-history">History</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Challenge</Heading>
        <Text elementType="p">
          This opportunity is at the challenge stage. When the last challenge score is entered, each proposal's price score
          is calculated.
        </Text>
        <dl style={facts}>
          <div style={fact}>
            <dt style={term}>Challenge score</dt>
            <dd style={detail}>Not yet scored</dd>
          </div>
        </dl>
        <div>
          <Button variant="primary" data-testid="proposal-score-challenge">Enter challenge score</Button>
        </div>
      </section>
    </div>
  ),
};
