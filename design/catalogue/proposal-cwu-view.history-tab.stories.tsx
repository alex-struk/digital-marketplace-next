import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, Link, Text } from "@bcgov/design-system-react-components";

// proposal-cwu-view · history-tab — the proposal's history, newest first, with who made each change, when, and any
// note. The score entered is recorded as a percentage (R-2.26, R-2.35)
const meta: Meta = { title: "proposals/proposal-cwu-view/history-tab" };
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
const base = "/opportunities/code-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000101/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000111";

const history = [
  { when: "October 7, 2026, 11:20 a.m.", entry: "Score entered: 87%", by: "Test Public Servant", note: "" },
  { when: "October 7, 2026, 11:20 a.m.", entry: "Evaluated", by: "Test Public Servant", note: "" },
  { when: "October 2, 2026, 4:00 p.m.", entry: "Under review", by: "System", note: "The opportunity closed." },
  { when: "September 15, 2026, 2:12 p.m.", entry: "Submitted", by: "Test Vendor", note: "" },
];

export const HistoryTab: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Code With Us proposal</Text>
      <Heading level={1}><span data-testid="proposal-proponent-name">Test Vendor</span></Heading>
      <Text elementType="p">Status: <span style={badge} data-testid="proposal-status">Evaluated</span></Text>
      <div data-testid="proposal-actions">
        <ButtonGroup ariaLabel="Proposal actions">
          <Button variant="primary" data-testid="proposal-award-button">Award</Button>
          <Button variant="secondary" danger data-testid="proposal-disqualify-button">Disqualify</Button>
        </ButtonGroup>
      </div>
      <nav aria-label="Proposal sections">
        <ul style={tabs}>
          <li><Link href={`${base}?tab=proposal`} data-testid="proposal-tab-proposal">Proposal</Link></li>
          <li><Link href={`${base}?tab=history`} aria-current="page" data-testid="proposal-tab-history">History</Link></li>
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
