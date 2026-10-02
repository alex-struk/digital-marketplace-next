import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-swu-view · team-questions-tab — the proposal's responses to the team questions, each with the consensus
// score the evaluation panel agreed. The panel's agreed scores are finalized on the opportunity's Consensus tab, which
// the evaluation domain designs; only proposals meeting every question's minimum score move on (R-2.21, R-2.29)
const meta: Meta = { title: "proposals/proposal-swu-view/team-questions-tab" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
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
const base = "/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000211";

const responses = [
  {
    question: "1. Describe how your team would approach user research for the renewal service.",
    response: "We would start with the renewal staff and the ten most common reasons a renewal is returned.",
    score: "17 of 20",
  },
  {
    question: "2. Describe a time your team replaced a legacy system without interrupting service.",
    response: "We moved a permit service to a new platform in stages, running both side by side for six weeks.",
    score: "16 of 20",
  },
];

export const TeamQuestionsTab: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Sprint With Us proposal</Text>
          <Heading level={1}><span data-testid="proposal-proponent-name">Example Digital Ltd.</span></Heading>
        </Stack>
        <Text elementType="p">Status: <span style={badge} data-testid="proposal-status">Under review: code challenge</span></Text>
        <Stack as="section" gap="medium" aria-labelledby="scores-heading">
          <Heading level={2} id="scores-heading">Scores</Heading>
          <Stack as="dl" direction="row" gap="medium">
            <Stack gap="small">
              <dt style={term}>Team questions</dt>
              <dd data-testid="proposal-questions-score">82.50%</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Code challenge</dt>
              <dd data-testid="proposal-challenge-score">Not yet scored</dd>
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
            <li><Link href={`${base}?tab=teamQuestions`} aria-current="page" data-testid="proposal-tab-team-questions">Team questions</Link></li>
            <li><Link href={`${base}?tab=codeChallenge`} data-testid="proposal-tab-code-challenge">Code challenge</Link></li>
            <li><Link href={`${base}?tab=teamScenario`} data-testid="proposal-tab-team-scenario">Team scenario</Link></li>
            <li><Link href={`${base}?tab=history`} data-testid="proposal-tab-history">History</Link></li>
          </Stack>
        </nav>
        <Stack as="section" gap="medium" aria-labelledby="tab-heading">
          <Heading level={2} id="tab-heading">Team questions</Heading>
          <Text elementType="p">
            Question scores are agreed by the evaluation panel on the opportunity's{" "}
            <Link href="/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/edit?tab=consensus">Consensus tab</Link>. Only
            proposals meeting every question's minimum score move on to the code challenge.
          </Text>
          <div role="region" aria-labelledby="questions-caption" tabIndex={0} style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <caption id="questions-caption" style={{ textAlign: "start" }}>
                <Text size="small" color="secondary">Responses and consensus scores</Text>
              </caption>
              <thead>
                <tr>
                  <th scope="col" style={cell}>Question</th>
                  <th scope="col" style={cell}>Response</th>
                  <th scope="col" style={cell}>Score</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((r) => (
                  <tr key={r.question}>
                    <td style={cell}>{r.question}</td>
                    <td style={cell}>{r.response}</td>
                    <td style={cell}>{r.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
