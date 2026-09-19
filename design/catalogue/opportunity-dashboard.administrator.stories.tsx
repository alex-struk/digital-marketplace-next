import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// opportunity-dashboard · administrator — an administrator sees every opportunity, with who created it (R-1.3)
const meta: Meta = { title: "opportunities/opportunity-dashboard/administrator" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
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

const rows = [
  { id: "7c1e2d40-5b1a-4c2e-9d3f-000000000101", program: "code-with-us", title: "Build an accessible permit tracker", programName: "Code With Us", status: "Published", updated: "September 10, 2026", author: "Test Public Servant" },
  { id: "7c1e2d40-5b1a-4c2e-9d3f-000000000202", program: "sprint-with-us", title: "Replace the grant intake forms", programName: "Sprint With Us", status: "Under review", updated: "September 8, 2026", author: "Test Public Servant" },
  { id: "7c1e2d40-5b1a-4c2e-9d3f-000000000302", program: "team-with-us", title: "Accessibility specialists for the digital office", programName: "Team With Us", status: "Draft", updated: "September 3, 2026", author: "Test Public Servant" },
  { id: "7c1e2d40-5b1a-4c2e-9d3f-000000000103", program: "code-with-us", title: "Add bilingual support to the park pass form", programName: "Code With Us", status: "Draft", updated: "September 2, 2026", author: "Test Public Servant Two" },
];

export const Administrator: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Dashboard</Heading>
      <div>
        <Link href="/opportunities/create" isButton buttonVariant="primary" data-testid="dashboard-create-opportunity">Create an opportunity</Link>
      </div>
      <section aria-labelledby="dashboard-mine-heading" style={stack}>
        <Heading level={2} id="dashboard-mine-heading">All opportunities</Heading>
        <div role="region" aria-labelledby="dashboard-caption" tabIndex={0} style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }} data-testid="dashboard-opportunities-table">
            <caption id="dashboard-caption" style={{ textAlign: "start" }}>
              <Text size="small" color="secondary">Every opportunity in the service, whoever created it</Text>
            </caption>
            <thead>
              <tr>
                <th scope="col" style={cell}>Title</th>
                <th scope="col" style={cell}>Program</th>
                <th scope="col" style={cell}>Status</th>
                <th scope="col" style={cell}>Last updated</th>
                <th scope="col" style={cell}>Created by</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} data-testid="dashboard-opportunity-row">
                  <td style={cell}>
                    <Link href={`/opportunities/${r.program}/${r.id}/edit`} data-testid="dashboard-opportunity-link">{r.title}</Link>
                  </td>
                  <td style={cell}>{r.programName}</td>
                  <td style={cell}><span style={badge} data-testid="opportunity-status">{r.status}</span></td>
                  <td style={cell}>{r.updated}</td>
                  <td style={cell}>{r.author}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  ),
};
