import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// opportunity-swu-edit · team-scenario-refused — starting the team scenario was refused because a proponent in the
// code challenge is neither scored nor disqualified (R-1.42)
const meta: Meta = { title: "opportunities/opportunity-swu-edit/team-scenario-refused" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const base = "/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/edit";

export const TeamScenarioRefused: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Manage a Sprint With Us opportunity</Text>
          <Heading level={1}>Modernize the licence renewal service</Heading>
        </Stack>
        <Stack direction="row" align="center" gap="medium">
          <Text elementType="p">Status: <span style={badge} data-testid="opportunity-status">Code challenge</span></Text>
          <Text elementType="p" size="small" color="secondary">
            Opportunity ID: <span data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000201</span>
          </Text>
        </Stack>
        <ButtonGroup ariaLabel="Opportunity actions">
          <Button variant="secondary" data-testid="opportunity-edit-button">Edit</Button>
          <Button variant="primary" data-testid="start-team-scenario-button">Start team scenario</Button>
          <Button variant="secondary" danger data-testid="opportunity-cancel-button">Cancel opportunity</Button>
        </ButtonGroup>
        <nav aria-label="Opportunity sections">
          <Stack as="ul" direction="row" gap="medium">
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
          </Stack>
        </nav>
        <div tabIndex={-1} data-testid="advance-refused-message">
          <InlineAlert
            variant="danger"
            title="The team scenario could not be started"
            description="All proponents must be scored first. Score or disqualify every proponent in the code challenge, and at least one must remain screened in."
            role="alert"
          />
        </div>
        <Stack as="section" gap="medium" aria-labelledby="tab-heading">
          <Heading level={2} id="tab-heading">Summary</Heading>
          <Text elementType="p">
            The team scenario can start once every proponent in the code challenge has been scored or disqualified and at least
            one remains screened in.
          </Text>
          <Stack as="dl" direction="row" gap="medium">
            <Stack gap="small">
              <dt style={term}>Created by</dt>
              <dd data-testid="opportunity-created-by">Test Public Servant</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Last changed by</dt>
              <dd data-testid="opportunity-last-changed-by">Test Administrator</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
