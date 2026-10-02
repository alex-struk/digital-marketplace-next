import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// evaluation-panel-twu · locked — from the consensus stage onward the panel is fixed, so it is listed rather than offered
// as a form (R-5.16). The action bar is the opportunities domain's, as the owner sees it at consensus (R-5.14).
const meta: Meta = { title: "evaluation/evaluation-panel-twu/locked" };
export default meta;

const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const cell = {
  textAlign: "start",
  verticalAlign: "top",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;
const base = "/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301/edit";

export const Locked: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Manage a Team With Us opportunity</Text>
          <Heading level={1}>Data platform team</Heading>
        </Stack>
        <Stack direction="row" align="center" gap="medium">
          <Text elementType="p">Status: <span style={badge} data-testid="opportunity-status">Resource questions: consensus</span></Text>
          <Text elementType="p" size="small" color="secondary">
            Opportunity ID: <span data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000301</span>
          </Text>
        </Stack>
        <ButtonGroup ariaLabel="Opportunity actions">
          <Button variant="primary" data-testid="finalize-consensus-button">Finalize consensus scores</Button>
        </ButtonGroup>
        <nav aria-label="Opportunity sections">
          <Stack as="ul" direction="row" gap="medium">
            <li><Link href={`${base}?tab=summary`} data-testid="opportunity-tab-summary">Summary</Link></li>
            <li><Link href={`${base}?tab=opportunity`} data-testid="opportunity-tab-opportunity">Opportunity</Link></li>
            <li><Link href={`${base}?tab=addenda`} data-testid="opportunity-tab-addenda">Addenda</Link></li>
            <li><Link href={`${base}?tab=history`} data-testid="opportunity-tab-history">History</Link></li>
            <li><Link href={`${base}?tab=proposals`} data-testid="opportunity-tab-proposals">Proposals</Link></li>
            <li><Link href={`${base}?tab=resourceQuestions`} data-testid="opportunity-tab-resource-questions">Resource questions</Link></li>
            <li><Link href={`${base}?tab=challenge`} data-testid="opportunity-tab-challenge">Challenge</Link></li>
            <li><Link href={`${base}?tab=evaluationPanel`} aria-current="page" data-testid="opportunity-tab-evaluation-panel">Evaluation panel</Link></li>
            <li><Link href={`${base}?tab=consensus`} data-testid="opportunity-tab-consensus">Consensus</Link></li>
          </Stack>
        </nav>
        <Stack as="section" gap="medium" aria-labelledby="tab-heading">
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
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
