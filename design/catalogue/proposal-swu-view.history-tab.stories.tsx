import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-swu-view · history-tab — every change of stage and every score, newest first, with who did it, when, and
// any note, including the calculated price score (R-2.30, R-2.35)
const meta: Meta = { title: "proposals/proposal-swu-view/history-tab" };
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
const base = "/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000211";

const history = [
  { when: "November 3, 2026, 3:10 p.m.", entry: "Price score calculated: 95.65%", by: "System", note: "" },
  { when: "November 3, 2026, 3:10 p.m.", entry: "Team scenario score entered: 88%", by: "Test Public Servant", note: "" },
  { when: "October 30, 2026, 10:15 a.m.", entry: "Under review: team scenario", by: "Test Public Servant", note: "Screened in." },
  { when: "October 27, 2026, 1:45 p.m.", entry: "Code challenge score entered: 90%", by: "Test Public Servant", note: "" },
  { when: "October 22, 2026, 9:30 a.m.", entry: "Under review: code challenge", by: "Test Public Servant", note: "Consensus scores finalized." },
  { when: "October 16, 2026, 4:00 p.m.", entry: "Under review: team questions", by: "System", note: "The opportunity closed." },
  { when: "October 10, 2026, 2:12 p.m.", entry: "Submitted", by: "Test Vendor", note: "" },
];

export const HistoryTab: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Sprint With Us proposal</Text>
          <Heading level={1}><span data-testid="proposal-proponent-name">Example Digital Ltd.</span></Heading>
        </Stack>
        <Text elementType="p">Status: <span style={badge} data-testid="proposal-status">Evaluated</span></Text>
        <div data-testid="proposal-actions">
          <ButtonGroup ariaLabel="Proposal actions">
            <Button variant="primary" data-testid="proposal-award-button">Award</Button>
            <Button variant="secondary" danger data-testid="proposal-disqualify-button">Disqualify</Button>
          </ButtonGroup>
        </div>
        <nav aria-label="Proposal sections">
          <Stack as="ul" direction="row" gap="medium">
            <li><Link href={`${base}?tab=proposal`} data-testid="proposal-tab-proposal">Proposal</Link></li>
            <li><Link href={`${base}?tab=teamQuestions`} data-testid="proposal-tab-team-questions">Team questions</Link></li>
            <li><Link href={`${base}?tab=codeChallenge`} data-testid="proposal-tab-code-challenge">Code challenge</Link></li>
            <li><Link href={`${base}?tab=teamScenario`} data-testid="proposal-tab-team-scenario">Team scenario</Link></li>
            <li><Link href={`${base}?tab=history`} aria-current="page" data-testid="proposal-tab-history">History</Link></li>
          </Stack>
        </nav>
        <Stack as="section" gap="medium" aria-labelledby="tab-heading">
          <Heading level={2} id="tab-heading">History</Heading>
          <div role="region" aria-labelledby="history-caption" tabIndex={0} style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%" }} data-testid="proposal-history-table">
              <caption id="history-caption" style={{ textAlign: "start" }}>
                <Text size="small" color="secondary">Every change of state and every score entered, newest first</Text>
              </caption>
              <thead>
                <tr>
                  <th scope="col" style={cell}>Date</th>
                  <th scope="col" style={cell}>Entry</th>
                  <th scope="col" style={cell}>By</th>
                  <th scope="col" style={cell}>Note</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={`${h.when}-${h.entry}`}>
                    <td style={cell}>{h.when}</td>
                    <td style={cell}>{h.entry}</td>
                    <td style={cell}>{h.by}</td>
                    <td style={cell}>{h.note}</td>
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
