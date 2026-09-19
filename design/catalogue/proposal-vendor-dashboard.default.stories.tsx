import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// proposal-vendor-dashboard · default — a vendor who owns an organization sees the proposals they wrote and, under a
// separate heading, the proposals written for organizations they own or administer, and never another vendor's. The
// section links move to each list (R-2.24)
const meta: Meta = { title: "proposals/proposal-vendor-dashboard/default" };
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
    status: "Submitted",
    updated: "September 15, 2026",
  },
  {
    href: "/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000211/edit",
    title: "Modernize the licence renewal service",
    program: "Sprint With Us",
    status: "Draft",
    updated: "September 12, 2026",
  },
];
const organizations = [
  {
    href: "/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000311/edit",
    title: "Data platform team",
    organization: "Example Digital Ltd.",
    program: "Team With Us",
    author: "Test Vendor Two",
    status: "Under review",
  },
];

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Dashboard</Heading>
      <nav aria-label="Dashboard sections">
        <ul style={tabs}>
          <li><Link href="#my-proposals" data-testid="dashboard-show-my-proposals">My proposals</Link></li>
          <li><Link href="#organization-proposals" data-testid="dashboard-show-org-proposals">My organizations' proposals</Link></li>
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
      <section id="organization-proposals" tabIndex={-1} aria-labelledby="org-proposals-heading" style={stack}>
        <Heading level={2} id="org-proposals-heading">My organizations' proposals</Heading>
        <div role="region" aria-labelledby="org-proposals-caption" tabIndex={0} style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }} data-testid="dashboard-org-proposals-table">
            <caption id="org-proposals-caption" style={{ textAlign: "start" }}>
              <Text size="small" color="secondary">Proposals written for organizations you own or administer</Text>
            </caption>
            <thead>
              <tr>
                <th scope="col" style={cell}>Opportunity</th>
                <th scope="col" style={cell}>Organization</th>
                <th scope="col" style={cell}>Program</th>
                <th scope="col" style={cell}>Written by</th>
                <th scope="col" style={cell}>Status</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((r) => (
                <tr key={r.href} data-testid="dashboard-proposal-row">
                  <td style={cell}><Link href={r.href} data-testid="dashboard-proposal-link">{r.title}</Link></td>
                  <td style={cell}>{r.organization}</td>
                  <td style={cell}>{r.program}</td>
                  <td style={cell}>{r.author}</td>
                  <td style={cell}><span style={badge} data-testid="proposal-status">{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  ),
};
