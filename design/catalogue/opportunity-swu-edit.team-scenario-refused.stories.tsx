import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";

// opportunity-swu-edit · team-scenario-refused — starting the team scenario was refused because a proponent in the
// code challenge is neither scored nor disqualified (R-1.42)
const meta: Meta = { title: "opportunities/opportunity-swu-edit/team-scenario-refused" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--layout-margin-medium)" } as const;
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
const base = "/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/edit";

export const TeamScenarioRefused: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a Sprint With Us opportunity</Text>
      <Heading level={1}>Modernize the licence renewal service</Heading>
      <div style={row}>
        <Text elementType="p">Status: <span style={badge} data-testid="opportunity-status">Code challenge</span></Text>
        <Text elementType="p" size="small" color="secondary">
          Opportunity ID: <span data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000201</span>
        </Text>
      </div>
      <ButtonGroup ariaLabel="Opportunity actions">
        <Button variant="secondary" data-testid="opportunity-edit-button">Edit</Button>
        <Button variant="primary" data-testid="start-team-scenario-button">Start team scenario</Button>
        <Button variant="secondary" danger data-testid="opportunity-cancel-button">Cancel opportunity</Button>
      </ButtonGroup>
      <nav aria-label="Opportunity sections">
        <ul style={tabs}>
          <li><Link href={`${base}?tab=summary`} aria-current="page" data-testid="opportunity-tab-summary">Summary</Link></li>
          <li><Link href={`${base}?tab=opportunity`} data-testid="opportunity-tab-opportunity">Opportunity</Link></li>
          <li><Link href={`${base}?tab=addenda`} data-testid="opportunity-tab-addenda">Addenda</Link></li>
          <li><Link href={`${base}?tab=history`} data-testid="opportunity-tab-history">History</Link></li>
          <li><Link href={`${base}?tab=proposals`} data-testid="opportunity-tab-proposals">Proposals</Link></li>
          <li><Link href={`${base}?tab=teamQuestions`} data-testid="opportunity-tab-team-questions">Team questions</Link></li>
          <li><Link href={`${base}?tab=codeChallenge`} data-testid="opportunity-tab-code-challenge">Code challenge</Link></li>
          <li><Link href={`${base}?tab=teamScenario`} data-testid="opportunity-tab-team-scenario">Team scenario</Link></li>
          <li><Link href={`${base}?tab=evaluationPanel`} data-testid="opportunity-tab-evaluation-panel">Evaluation panel</Link></li>
          <li><Link href={`${base}?tab=consensus`} data-testid="opportunity-tab-consensus">Consensus</Link></li>
        </ul>
      </nav>
      <div tabIndex={-1} data-testid="advance-refused-message">
        <InlineAlert
          variant="danger"
          title="The team scenario could not be started"
          description="All proponents must be scored first. Score or disqualify every proponent in the code challenge, and at least one must remain screened in."
          role="alert"
        />
      </div>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Summary</Heading>
        <Text elementType="p">
          The team scenario can start once every proponent in the code challenge has been scored or disqualified and at least
          one remains screened in.
        </Text>
        <dl style={facts}>
          <div style={fact}>
            <dt style={term}>Created by</dt>
            <dd style={detail} data-testid="opportunity-created-by">Test Public Servant</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Last changed by</dt>
            <dd style={detail} data-testid="opportunity-last-changed-by">Test Administrator</dd>
          </div>
        </dl>
      </section>
    </div>
  ),
};
