import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";

// evaluation-panel-swu · locked — from the consensus stage onward the panel is fixed, so it is listed rather than offered
// as a form (R-5.16). The action bar is the opportunities domain's, as the owner sees it at consensus (R-5.14).
const meta: Meta = { title: "evaluation/evaluation-panel-swu/locked" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--layout-margin-medium)" } as const;
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
const cell = {
  textAlign: "start",
  verticalAlign: "top",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;
const base = "/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/edit";

export const Locked: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a Sprint With Us opportunity</Text>
      <Heading level={1}>Modernize the licence renewal service</Heading>
      <div style={row}>
        <Text elementType="p">Status: <span style={badge} data-testid="opportunity-status">Team questions: consensus</span></Text>
        <Text elementType="p" size="small" color="secondary">
          Opportunity ID: <span data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000201</span>
        </Text>
      </div>
      <ButtonGroup ariaLabel="Opportunity actions">
        <Button variant="primary" data-testid="finalize-consensus-button">Finalize consensus scores</Button>
      </ButtonGroup>
      <nav aria-label="Opportunity sections">
        <ul style={tabs}>
          <li><Link href={`${base}?tab=summary`} data-testid="opportunity-tab-summary">Summary</Link></li>
          <li><Link href={`${base}?tab=opportunity`} data-testid="opportunity-tab-opportunity">Opportunity</Link></li>
          <li><Link href={`${base}?tab=addenda`} data-testid="opportunity-tab-addenda">Addenda</Link></li>
          <li><Link href={`${base}?tab=history`} data-testid="opportunity-tab-history">History</Link></li>
          <li><Link href={`${base}?tab=proposals`} data-testid="opportunity-tab-proposals">Proposals</Link></li>
          <li><Link href={`${base}?tab=teamQuestions`} data-testid="opportunity-tab-team-questions">Team questions</Link></li>
          <li><Link href={`${base}?tab=codeChallenge`} data-testid="opportunity-tab-code-challenge">Code challenge</Link></li>
          <li><Link href={`${base}?tab=teamScenario`} data-testid="opportunity-tab-team-scenario">Team scenario</Link></li>
          <li><Link href={`${base}?tab=evaluationPanel`} aria-current="page" data-testid="opportunity-tab-evaluation-panel">Evaluation panel</Link></li>
          <li><Link href={`${base}?tab=consensus`} data-testid="opportunity-tab-consensus">Consensus</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Evaluation panel</Heading>
        <div data-testid="evaluation-panel-locked-message">
          <InlineAlert
            variant="info"
            title="The evaluation panel can no longer be changed"
            description="The consensus stage has begun, so the panel is fixed."
          />
        </div>
        <div role="region" aria-labelledby="panel-caption" tabIndex={0} style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <caption id="panel-caption" style={{ textAlign: "start" }}>
              <Text size="small" color="secondary">Members of the evaluation panel</Text>
            </caption>
            <thead>
              <tr>
                <th scope="col" style={cell}>Name</th>
                <th scope="col" style={cell}>Role</th>
              </tr>
            </thead>
            <tbody>
              <tr data-testid="evaluation-panel-member-row">
                <td style={cell}>Test Evaluator One</td>
                <td style={cell}>Evaluator and chair</td>
              </tr>
              <tr data-testid="evaluation-panel-member-row">
                <td style={cell}>Test Evaluator Two</td>
                <td style={cell}>Evaluator</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  ),
};
