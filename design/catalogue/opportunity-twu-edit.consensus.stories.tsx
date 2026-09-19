import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, Link, Text } from "@bcgov/design-system-react-components";

// opportunity-twu-edit · consensus — at the consensus stage the opportunity's owner or an administrator may finalise
// the agreed scores; this is the one path out of the stage (R-1.41, R-1.50, R-5.14). The same action bar sits above
// every tab, including the evaluation domain's Consensus tab.
const meta: Meta = { title: "opportunities/opportunity-twu-edit/consensus" };
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
const base = "/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301/edit";

export const Consensus: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a Team With Us opportunity</Text>
      <Heading level={1}>Data platform team</Heading>
      <div style={row}>
        <Text elementType="p">Status: <span style={badge} data-testid="opportunity-status">Resource questions: consensus</span></Text>
        <Text elementType="p" size="small" color="secondary">
          Opportunity ID: <span data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000301</span>
        </Text>
      </div>
      <ButtonGroup ariaLabel="Opportunity actions">
        <Button variant="secondary" data-testid="opportunity-edit-button">Edit</Button>
        <Button variant="primary" data-testid="finalize-consensus-button">Finalize consensus scores</Button>
        <Button variant="secondary" danger data-testid="opportunity-cancel-button">Cancel opportunity</Button>
      </ButtonGroup>
      <nav aria-label="Opportunity sections">
        <ul style={tabs}>
          <li><Link href={`${base}?tab=summary`} aria-current="page" data-testid="opportunity-tab-summary">Summary</Link></li>
          <li><Link href={`${base}?tab=opportunity`} data-testid="opportunity-tab-opportunity">Opportunity</Link></li>
          <li><Link href={`${base}?tab=addenda`} data-testid="opportunity-tab-addenda">Addenda</Link></li>
          <li><Link href={`${base}?tab=history`} data-testid="opportunity-tab-history">History</Link></li>
          <li><Link href={`${base}?tab=proposals`} data-testid="opportunity-tab-proposals">Proposals</Link></li>
          <li><Link href={`${base}?tab=resourceQuestions`} data-testid="opportunity-tab-resource-questions">Resource questions</Link></li>
          <li><Link href={`${base}?tab=challenge`} data-testid="opportunity-tab-challenge">Challenge</Link></li>
          <li><Link href={`${base}?tab=evaluationPanel`} data-testid="opportunity-tab-evaluation-panel">Evaluation panel</Link></li>
          <li><Link href={`${base}?tab=consensus`} data-testid="opportunity-tab-consensus">Consensus</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Summary</Heading>
        <Text elementType="p">
          Finalizing records the agreed scores against each proponent and moves up to three proponents who met every minimum
          score into the challenge. It cannot be undone.
        </Text>
        <dl style={facts}>
          <div style={fact}>
            <dt style={term}>Proposal deadline</dt>
            <dd style={detail}>September 11, 2026 at 4:00 p.m. Pacific time</dd>
          </div>
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
