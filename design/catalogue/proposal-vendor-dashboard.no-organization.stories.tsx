import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// proposal-vendor-dashboard · no-organization — a vendor who owns and administers no organization sees only the
// proposals they wrote. There is no organizations' heading and no link to one (R-2.24)
const meta: Meta = { title: "proposals/proposal-vendor-dashboard/no-organization" };
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

const mine = [
  {
    href: "/opportunities/code-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000101/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000111/edit",
    title: "Build an accessible permit tracker",
    program: "Code With Us",
    status: "Withdrawn",
    updated: "September 18, 2026",
  },
];

export const NoOrganization: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Dashboard</Heading>
      <nav aria-label="Dashboard sections">
        <ul style={tabs}>
          <li><Link href="#my-proposals" data-testid="dashboard-show-my-proposals">My proposals</Link></li>
        </ul>
      </nav>
      <section id="my-proposals" tabIndex={-1} aria-labelledby="my-proposals-heading" style={stack}>
        <Heading level={2} id="my-proposals-heading">My proposals</Heading>
        <div role="region" aria-labelledby="my-proposals-caption" tabIndex={0} style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }} data-testid="dashboard-my-proposals-table">
            <caption id="my-proposals-caption" style={{ textAlign: "start" }}>
              <Text size="small" color="secondary">Proposals you wrote, most recently updated first</Text>
            </caption>
            <thead>
              <tr>
                <th scope="col" style={cell}>Opportunity</th>
                <th scope="col" style={cell}>Program</th>
                <th scope="col" style={cell}>Status</th>
                <th scope="col" style={cell}>Last updated</th>
              </tr>
            </thead>
            <tbody>
              {mine.map((r) => (
                <tr key={r.href} data-testid="dashboard-proposal-row">
                  <td style={cell}><Link href={r.href} data-testid="dashboard-proposal-link">{r.title}</Link></td>
                  <td style={cell}>{r.program}</td>
                  <td style={cell}><span style={badge} data-testid="proposal-status">{r.status}</span></td>
                  <td style={cell}>{r.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  ),
};
