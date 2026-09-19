import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";

// proposal-swu-view · wrong-stage — a team scenario score was entered while the opportunity was still at the code
// challenge stage, and the service refused it. The tab said which stage the opportunity is at before the button was
// pressed (R-2.28)
const meta: Meta = { title: "proposals/proposal-swu-view/wrong-stage" };
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
const base = "/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000211";

export const WrongStage: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Sprint With Us proposal</Text>
      <Heading level={1}><span data-testid="proposal-proponent-name">Example Digital Ltd.</span></Heading>
      <Text elementType="p">Status: <span style={badge} data-testid="proposal-status">Under review: code challenge</span></Text>
      <section aria-labelledby="scores-heading" style={tight}>
        <Heading level={2} id="scores-heading">Scores</Heading>
        <dl style={facts}>
          <div style={fact}>
            <dt style={term}>Team questions</dt>
            <dd style={detail} data-testid="proposal-questions-score">82.50%</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Code challenge</dt>
            <dd style={detail} data-testid="proposal-challenge-score">Not yet scored</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Team scenario</dt>
            <dd style={detail} data-testid="proposal-scenario-score">Not yet scored</dd>
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
          <li><Link href={`${base}?tab=teamQuestions`} data-testid="proposal-tab-team-questions">Team questions</Link></li>
          <li><Link href={`${base}?tab=codeChallenge`} data-testid="proposal-tab-code-challenge">Code challenge</Link></li>
          <li><Link href={`${base}?tab=teamScenario`} aria-current="page" data-testid="proposal-tab-team-scenario">Team scenario</Link></li>
          <li><Link href={`${base}?tab=history`} data-testid="proposal-tab-history">History</Link></li>
        </ul>
      </nav>
      <div tabIndex={-1} data-testid="proposal-wrong-stage-error">
        <InlineAlert variant="danger" title="That score was not entered" role="alert">
          <Text elementType="p">The opportunity is not in the correct stage of evaluation to perform that action.</Text>
        </InlineAlert>
      </div>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Team scenario</Heading>
        <Text elementType="p">
          This opportunity is at the code challenge stage. Team scenario scores can be entered once it reaches the team
          scenario.
        </Text>
        <dl style={facts}>
          <div style={fact}>
            <dt style={term}>Team scenario score</dt>
            <dd style={detail}>Not yet scored</dd>
          </div>
        </dl>
        <div>
          <Button variant="primary" data-testid="proposal-score-team-scenario">Enter team scenario score</Button>
        </div>
      </section>
    </div>
  ),
};
