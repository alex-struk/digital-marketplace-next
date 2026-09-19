import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";

// organization-edit · twu-administrator — a service administrator on the Team With Us qualification tab, the only
// person offered Edit service areas (R-3.26, R-3.28)
// Service area names are illustrative: the spec does not carry the service's list.
const meta: Meta = { title: "organizations/organization-edit/twu-administrator" };
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

export const TwuAdministrator: StoryObj = {
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
          <li><Link href={`${base}?tab=twu-qualification`} aria-current="page" data-testid="organization-tab-twu-qualification">Team With Us qualification</Link></li>
          <li><Link href={`${base}?tab=changelog`} data-testid="organization-tab-changelog">Changelog</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Team With Us qualification</Heading>
        <div data-testid="organization-not-qualified-notice">
          <InlineAlert
            variant="info"
            title="This organization is not qualified for Team With Us"
            description="It can propose on Team With Us opportunities once every requirement below is met."
          />
        </div>
        <ul style={list} aria-label="Team With Us requirements">
          <li style={item} data-testid="organization-twu-requirement-service-area">
            <span style={badge}>Met</span> Approved for at least one service area
          </li>
          <li style={item} data-testid="organization-twu-requirement-terms-accepted">
            <span style={badge}>Not met</span> Team With Us terms and conditions accepted
          </li>
        </ul>
        <section aria-labelledby="areas-heading" style={stack}>
          <Heading level={3} id="areas-heading">Approved service areas</Heading>
          <ul>
            <li data-testid="organization-service-area">Full stack developer</li>
            <li data-testid="organization-service-area">Data professional</li>
          </ul>
          <div>
            <Button variant="secondary" data-testid="organization-edit-service-areas-button">Edit service areas</Button>
          </div>
        </section>
        <section aria-labelledby="terms-heading" style={stack}>
          <Heading level={3} id="terms-heading">Terms and conditions</Heading>
          <Text elementType="p">The Team With Us terms and conditions have not been accepted for this organization.</Text>
          <Text elementType="p">
            <Link href={`/organizations/${orgId}/team-with-us-terms-and-conditions`} data-testid="organization-view-twu-terms-link">
              Read the Team With Us terms and conditions
            </Link>
          </Text>
        </section>
      </section>
    </div>
  ),
};
