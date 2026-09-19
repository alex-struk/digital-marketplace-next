import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, Link, Text } from "@bcgov/design-system-react-components";

// proposal-swu-edit · history-tab — the vendor reads the history of a proposal they wrote: every change of state and
// every score, newest first, with who made it and any note. The proposal has been passed over, so its scores may be
// shown (R-2.9, R-2.32, R-2.35)
const meta: Meta = { title: "proposals/proposal-swu-edit/history-tab" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
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
const base = "/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000211";

const history = [
  { when: "November 10, 2026, 4:05 p.m.", entry: "Not awarded", by: "Test Administrator", note: "" },
  { when: "November 3, 2026, 3:10 p.m.", entry: "Price score calculated: 95.65%", by: "System", note: "" },
  { when: "November 3, 2026, 3:10 p.m.", entry: "Team scenario score entered: 79%", by: "Test Public Servant", note: "" },
  { when: "October 27, 2026, 1:45 p.m.", entry: "Code challenge score entered: 81%", by: "Test Public Servant", note: "" },
  { when: "October 22, 2026, 9:30 a.m.", entry: "Under review: code challenge", by: "Test Public Servant", note: "Consensus scores finalized." },
  { when: "October 16, 2026, 4:00 p.m.", entry: "Under review: team questions", by: "System", note: "The opportunity closed." },
  { when: "October 10, 2026, 2:12 p.m.", entry: "Submitted", by: "Test Vendor", note: "" },
];

export const HistoryTab: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a Sprint With Us proposal</Text>
      <Heading level={1}>Modernize the licence renewal service</Heading>
      <Text elementType="p">Status: <span style={badge} data-testid="proposal-status">Not awarded</span></Text>
      <div data-testid="proposal-actions">
        <ButtonGroup ariaLabel="Proposal actions">
          <Button variant="secondary" danger data-testid="proposal-withdraw-button">Withdraw</Button>
        </ButtonGroup>
      </div>
      <nav aria-label="Proposal sections">
        <ul style={tabs}>
          <li><Link href={`${base}/edit?tab=proposal`} data-testid="proposal-tab-proposal">Proposal</Link></li>
          <li><Link href={`${base}/edit?tab=scoresheet`} data-testid="proposal-tab-scoresheet">Scoresheet</Link></li>
          <li><Link href={`${base}/edit?tab=history`} aria-current="page" data-testid="proposal-tab-history">History</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
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
      </section>
    </div>
  ),
};
