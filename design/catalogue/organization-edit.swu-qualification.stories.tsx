import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";

// organization-edit · swu-qualification — the owner on the Sprint With Us qualification tab: two active members who
// between them hold every capability, but the terms not yet accepted, so the organization is not qualified (R-3.25)
const meta: Meta = { title: "organizations/organization-edit/swu-qualification" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
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

export const SwuQualification: StoryObj = {
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
          <li><Link href={`${base}?tab=swu-qualification`} aria-current="page" data-testid="organization-tab-swu-qualification">Sprint With Us qualification</Link></li>
          <li><Link href={`${base}?tab=twu-qualification`} data-testid="organization-tab-twu-qualification">Team With Us qualification</Link></li>
          <li><Link href={`${base}?tab=changelog`} data-testid="organization-tab-changelog">Changelog</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Sprint With Us qualification</Heading>
        <div data-testid="organization-not-qualified-notice">
          <InlineAlert
            variant="info"
            title="This organization is not qualified for Sprint With Us"
            description="It can propose on Sprint With Us opportunities once every requirement below is met."
          />
        </div>
        <ul style={list} aria-label="Sprint With Us requirements">
          <li style={item} data-testid="organization-swu-requirement-two-members">
            <span style={badge}>Met</span> At least two active team members
          </li>
          <li style={item} data-testid="organization-swu-requirement-all-capabilities">
            <span style={badge}>Met</span> Active team members between them hold every capability
          </li>
          <li style={item} data-testid="organization-swu-requirement-terms-accepted">
            <span style={badge}>Not met</span> Sprint With Us terms and conditions accepted
          </li>
        </ul>
        <Text elementType="p">Invited people who have not yet accepted do not count towards team size or capabilities.</Text>
        <section aria-labelledby="terms-heading" style={stack}>
          <Heading level={3} id="terms-heading">Terms and conditions</Heading>
          <Text elementType="p">The Sprint With Us terms and conditions have not been accepted for this organization.</Text>
          <Text elementType="p">
            <Link href={`/organizations/${orgId}/sprint-with-us-terms-and-conditions`} data-testid="organization-view-swu-terms-link">
              Read and accept the Sprint With Us terms and conditions
            </Link>
          </Text>
        </section>
      </section>
    </div>
  ),
};
