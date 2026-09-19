import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, Link, Text } from "@bcgov/design-system-react-components";

// proposal-twu-view · resource-questions-tab — the proposal's responses to the resource questions. Staff may enter the
// resource question scores here, and screen the proposal in to or out of the challenge. Finalizing the panel's agreed
// scores moves the top proposals meeting every minimum on by itself (R-2.7, R-2.28, R-2.29)
const meta: Meta = { title: "proposals/proposal-twu-view/resource-questions-tab" };
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
const cell = {
  textAlign: "start",
  verticalAlign: "top",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;
const base = "/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000311";

export const ResourceQuestionsTab: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Team With Us proposal</Text>
      <Heading level={1}><span data-testid="proposal-proponent-name">Proponent 1</span></Heading>
      <Text elementType="p">Status: <span style={badge} data-testid="proposal-status">Under review: resource questions</span></Text>
      <section aria-labelledby="scores-heading" style={tight}>
        <Heading level={2} id="scores-heading">Scores</Heading>
        <dl style={facts}>
          <div style={fact}>
            <dt style={term}>Resource questions</dt>
            <dd style={detail} data-testid="proposal-questions-score">Not yet scored</dd>
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
          <li><Link href={`${base}?tab=resourceQuestions`} aria-current="page" data-testid="proposal-tab-resource-questions">Resource questions</Link></li>
          <li><Link href={`${base}?tab=challenge`} data-testid="proposal-tab-challenge">Challenge</Link></li>
          <li><Link href={`${base}?tab=history`} data-testid="proposal-tab-history">History</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Resource questions</Heading>
        <Text elementType="p">
          This opportunity is at the resource questions stage. Only proposals meeting every question's minimum score can move
          on to the challenge.
        </Text>
        <div role="region" aria-labelledby="questions-caption" tabIndex={0} style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <caption id="questions-caption" style={{ textAlign: "start" }}>
              <Text size="small" color="secondary">Responses and scores</Text>
            </caption>
            <thead>
              <tr>
                <th scope="col" style={cell}>Question</th>
                <th scope="col" style={cell}>Response</th>
                <th scope="col" style={cell}>Score</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={cell}>1. Describe your experience building data pipelines for health data.</td>
                <td style={cell}>Our team has built and run the ingestion pipelines for two provincial registries.</td>
                <td style={cell}>Not yet scored</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ButtonGroup ariaLabel="Resource question actions">
          <Button variant="primary" data-testid="proposal-score-resource-questions">Enter resource question scores</Button>
          <Button variant="secondary" data-testid="proposal-screen-in">Screen in to challenge</Button>
          <Button variant="secondary" data-testid="proposal-screen-out">Screen out from challenge</Button>
        </ButtonGroup>
      </section>
    </div>
  ),
};
