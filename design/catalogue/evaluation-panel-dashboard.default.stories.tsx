import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// evaluation-panel-dashboard · default — a public sector employee who sits on three panels sees them under their own
// "Evaluations" heading, a draft included (R-5.19). The My opportunities section is the opportunities domain's, unchanged.
const meta: Meta = { title: "evaluation/evaluation-panel-dashboard/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
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
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

const myRows = [
  { id: "7c1e2d40-5b1a-4c2e-9d3f-000000000101", program: "code-with-us", title: "Build an accessible permit tracker", programName: "Code With Us", status: "Published", updated: "September 10, 2026" },
];
// Illustrative. The draft shows that a panel member sees an opportunity before it is public (R-5.19).
const panelRows = [
  { id: "7c1e2d40-5b1a-4c2e-9d3f-000000000201", program: "sprint-with-us", title: "Modernize the licence renewal service", programName: "Sprint With Us", role: "Evaluator and chair", status: "Team questions: individual evaluation" },
  { id: "7c1e2d40-5b1a-4c2e-9d3f-000000000301", program: "team-with-us", title: "Data platform team", programName: "Team With Us", role: "Evaluator", status: "Resource questions: consensus" },
  { id: "7c1e2d40-5b1a-4c2e-9d3f-000000000203", program: "sprint-with-us", title: "Digital identity pilot", programName: "Sprint With Us", role: "Evaluator", status: "Draft" },
];

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Dashboard</Heading>
      <div>
        <Link href="/opportunities/create" isButton buttonVariant="primary" data-testid="dashboard-create-opportunity">Create an opportunity</Link>
      </div>
      <nav aria-label="Dashboard sections">
        <ul style={tabs}>
          <li><Link href="#my-opportunities" data-testid="dashboard-show-my-opportunities">My opportunities</Link></li>
          <li><Link href="#evaluations" data-testid="dashboard-show-evaluations">Evaluations</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="dashboard-mine-heading" id="my-opportunities" style={stack}>
        <Heading level={2} id="dashboard-mine-heading">My opportunities</Heading>
        <div role="region" aria-labelledby="dashboard-caption" tabIndex={0} style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }} data-testid="dashboard-opportunities-table">
            <caption id="dashboard-caption" style={{ textAlign: "start" }}>
              <Text size="small" color="secondary">Opportunities you created</Text>
            </caption>
            <thead>
              <tr>
                <th scope="col" style={cell}>Title</th>
                <th scope="col" style={cell}>Program</th>
                <th scope="col" style={cell}>Status</th>
                <th scope="col" style={cell}>Last updated</th>
              </tr>
            </thead>
            <tbody>
              {myRows.map((r) => (
                <tr key={r.id} data-testid="dashboard-opportunity-row">
                  <td style={cell}>
                    <Link href={`/opportunities/${r.program}/${r.id}/edit`} data-testid="dashboard-opportunity-link">{r.title}</Link>
                  </td>
                  <td style={cell}>{r.programName}</td>
                  <td style={cell}><span style={badge} data-testid="opportunity-status">{r.status}</span></td>
                  <td style={cell}>{r.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section aria-labelledby="dashboard-evaluations-heading" id="evaluations" style={stack}>
        <Heading level={2} id="dashboard-evaluations-heading">Evaluations</Heading>
        <Text elementType="p">Opportunities whose evaluation panel you sit on, including drafts that are not yet public.</Text>
        <div role="region" aria-labelledby="dashboard-panel-caption" tabIndex={0} style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }} data-testid="dashboard-panel-opportunities-table">
            <caption id="dashboard-panel-caption" style={{ textAlign: "start" }}>
              <Text size="small" color="secondary">Opportunities you are evaluating</Text>
            </caption>
            <thead>
              <tr>
                <th scope="col" style={cell}>Title</th>
                <th scope="col" style={cell}>Program</th>
                <th scope="col" style={cell}>Your role</th>
                <th scope="col" style={cell}>Status</th>
              </tr>
            </thead>
            <tbody>
              {panelRows.map((r) => (
                <tr key={r.id} data-testid="dashboard-panel-opportunity-row">
                  <td style={cell}>
                    <Link href={`/opportunities/${r.program}/${r.id}/edit`} data-testid="dashboard-opportunity-link">{r.title}</Link>
                  </td>
                  <td style={cell}>{r.programName}</td>
                  <td style={cell}>{r.role}</td>
                  <td style={cell}><span style={badge} data-testid="opportunity-status">{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  ),
};
