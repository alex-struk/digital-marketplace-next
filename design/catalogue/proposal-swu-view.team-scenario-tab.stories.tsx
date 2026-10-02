import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-swu-view · team-scenario-tab — the proposal was screened in to the team scenario. Entering the last team
// scenario score also calculates every proposal's price score and makes this one fully evaluated (R-2.28, R-2.30)
const meta: Meta = { title: "proposals/proposal-swu-view/team-scenario-tab" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const base = "/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000211";

export const TeamScenarioTab: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Sprint With Us proposal</Text>
          <Heading level={1}><span data-testid="proposal-proponent-name">Example Digital Ltd.</span></Heading>
        </Stack>
        <Text elementType="p">Status: <span style={badge} data-testid="proposal-status">Under review: team scenario</span></Text>
        <Stack as="section" gap="medium" aria-labelledby="scores-heading">
          <Heading level={2} id="scores-heading">Scores</Heading>
          <Stack as="dl" direction="row" gap="medium">
            <Stack gap="small">
              <dt style={term}>Team questions</dt>
              <dd data-testid="proposal-questions-score">82.50%</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Code challenge</dt>
              <dd data-testid="proposal-challenge-score">90%</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Team scenario</dt>
              <dd data-testid="proposal-scenario-score">Not yet scored</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Price</dt>
              <dd data-testid="proposal-price-score">Not yet calculated</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Total</dt>
              <dd data-testid="proposal-total-score">Not yet calculated</dd>
            </Stack>
          </Stack>
        </Stack>
        <div data-testid="proposal-actions">
          <ButtonGroup ariaLabel="Proposal actions">
            <Button variant="secondary" danger data-testid="proposal-disqualify-button">Disqualify</Button>
          </ButtonGroup>
        </div>
        <nav aria-label="Proposal sections">
          <Stack as="ul" direction="row" gap="medium">
            <li><Link href={`${base}?tab=proposal`} data-testid="proposal-tab-proposal">Proposal</Link></li>
            <li><Link href={`${base}?tab=teamQuestions`} data-testid="proposal-tab-team-questions">Team questions</Link></li>
            <li><Link href={`${base}?tab=codeChallenge`} data-testid="proposal-tab-code-challenge">Code challenge</Link></li>
            <li><Link href={`${base}?tab=teamScenario`} aria-current="page" data-testid="proposal-tab-team-scenario">Team scenario</Link></li>
            <li><Link href={`${base}?tab=history`} data-testid="proposal-tab-history">History</Link></li>
          </Stack>
        </nav>
        <Stack as="section" gap="medium" aria-labelledby="tab-heading">
          <Heading level={2} id="tab-heading">Team scenario</Heading>
          <Text elementType="p">
            This opportunity is at the team scenario stage. When the last team scenario score is entered, each proposal's
            price score is calculated.
          </Text>
          <Stack as="dl" direction="row" gap="medium">
            <Stack gap="small">
              <dt style={term}>Team scenario score</dt>
              <dd>Not yet scored</dd>
            </Stack>
          </Stack>
          <div>
            <Button variant="primary" data-testid="proposal-score-team-scenario">Enter team scenario score</Button>
          </div>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
