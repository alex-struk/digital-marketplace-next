import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// organization-edit · changelog — every grant and withdrawal of administrator rights and every transfer of
// ownership, most recent first, with whom it concerned, when, and who made it (R-3.33)
const meta: Meta = { title: "organizations/organization-edit/changelog" };
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
const orgId = "4a9e1c20-6d3b-4f1a-8e2c-000000000201";
const base = `/organizations/${orgId}/edit`;

const entries = [
  { when: "September 14, 2026, 3:05 p.m.", event: "Admin Rights Removed", member: "Test Vendor Four", by: "Test Vendor One" },
  { when: "September 10, 2026, 9:40 a.m.", event: "Admin Rights Given", member: "Test Vendor Four", by: "Test Vendor One" },
  { when: "August 28, 2026, 11:15 a.m.", event: "Ownership Transferred", member: "Test Vendor One", by: "Test Administrator" },
];

export const Changelog: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Edit Organization</Text>
      <Heading level={1}>Northwind Digital Co-operative</Heading>
      <Text elementType="p" size="small" color="secondary">
        Organization ID: <span data-testid="organization-identifier">{orgId}</span>
      </Text>
      <nav aria-label="Organization sections">
        <ul style={tabs}>
          <li><Link href={`${base}?tab=organization`} data-testid="organization-tab-organization">Organization</Link></li>
          <li><Link href={`${base}?tab=team`} data-testid="organization-tab-team">Team members</Link></li>
          <li><Link href={`${base}?tab=swu-qualification`} data-testid="organization-tab-swu-qualification">Sprint With Us qualification</Link></li>
          <li><Link href={`${base}?tab=twu-qualification`} data-testid="organization-tab-twu-qualification">Team With Us qualification</Link></li>
          <li><Link href={`${base}?tab=changelog`} aria-current="page" data-testid="organization-tab-changelog">Changelog</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Changelog</Heading>
        <div role="region" aria-labelledby="changelog-caption" tabIndex={0} style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <caption id="changelog-caption" style={{ textAlign: "start" }}>
              <Text size="small" color="secondary">Changes to administrator rights and ownership, newest first</Text>
            </caption>
            <thead>
              <tr>
                <th scope="col" style={cell}>Date</th>
                <th scope="col" style={cell}>Change</th>
                <th scope="col" style={cell}>Member</th>
                <th scope="col" style={cell}>Made by</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.when} data-testid="organization-changelog-entry">
                  <td style={cell}>{e.when}</td>
                  <td style={cell}>{e.event}</td>
                  <td style={cell}>{e.member}</td>
                  <td style={cell}>{e.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  ),
};
