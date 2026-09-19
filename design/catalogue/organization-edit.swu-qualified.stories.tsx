import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// organization-edit · swu-qualified — every Sprint With Us requirement met: the qualified badge appears beside the
// organization's name, and the tab states when the terms were accepted (R-3.25, R-3.27)
const meta: Meta = { title: "organizations/organization-edit/swu-qualified" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--layout-margin-medium)" } as const;
const list = { display: "grid", gap: "var(--layout-margin-small)", listStyle: "none", margin: "var(--layout-margin-none)", padding: "var(--layout-padding-none)" } as const;
const item = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--layout-margin-small)" } as const;
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
const orgId = "4a9e1c20-6d3b-4f1a-8e2c-000000000201";
const base = `/organizations/${orgId}/edit`;

export const SwuQualified: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Edit Organization</Text>
      <Heading level={1}>Northwind Digital Co-operative</Heading>
      <div style={row}>
        <span style={badge} data-testid="organization-swu-qualified-badge">Sprint With Us qualified</span>
        <Text elementType="p" size="small" color="secondary">
          Organization ID: <span data-testid="organization-identifier">{orgId}</span>
        </Text>
      </div>
      <nav aria-label="Organization sections">
        <ul style={tabs}>
          <li><Link href={`${base}?tab=organization`} data-testid="organization-tab-organization">Organization</Link></li>
          <li><Link href={`${base}?tab=team`} data-testid="organization-tab-team">Team members</Link></li>
          <li><Link href={`${base}?tab=swu-qualification`} aria-current="page" data-testid="organization-tab-swu-qualification">Sprint With Us qualification</Link></li>
          <li><Link href={`${base}?tab=twu-qualification`} data-testid="organization-tab-twu-qualification">Team With Us qualification</Link></li>
          <li><Link href={`${base}?tab=changelog`} data-testid="organization-tab-changelog">Changelog</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Sprint With Us qualification</Heading>
        <Text elementType="p">This organization is qualified to propose on Sprint With Us opportunities.</Text>
        <ul style={list} aria-label="Sprint With Us requirements">
          <li style={item} data-testid="organization-swu-requirement-two-members">
            <span style={badge}>Met</span> At least two active team members
          </li>
          <li style={item} data-testid="organization-swu-requirement-all-capabilities">
            <span style={badge}>Met</span> Active team members between them hold every capability
          </li>
          <li style={item} data-testid="organization-swu-requirement-terms-accepted">
            <span style={badge}>Met</span> Sprint With Us terms and conditions accepted
          </li>
        </ul>
        <section aria-labelledby="terms-heading" style={stack}>
          <Heading level={3} id="terms-heading">Terms and conditions</Heading>
          <Text elementType="p" data-testid="organization-swu-terms-accepted-on">Accepted on September 1, 2026 at 10:30 a.m.</Text>
          <Text elementType="p">
            <Link href={`/organizations/${orgId}/sprint-with-us-terms-and-conditions`} data-testid="organization-view-swu-terms-link">
              Read the Sprint With Us terms and conditions
            </Link>
          </Text>
        </section>
      </section>
    </div>
  ),
};
