import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text, TextField } from "@bcgov/design-system-react-components";

// organization-edit · org-admin — a member the owner made an administrator, who is not the owner: the profile is
// read-only and neither Edit nor Archive is offered (R-3.3, R-3.18)
const meta: Meta = { title: "organizations/organization-edit/org-admin" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--layout-margin-medium)" } as const;
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

export const OrgAdmin: StoryObj = {
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
          <li><Link href={`${base}?tab=organization`} aria-current="page" data-testid="organization-tab-organization">Organization</Link></li>
          <li><Link href={`${base}?tab=team`} data-testid="organization-tab-team">Team members</Link></li>
          <li><Link href={`${base}?tab=swu-qualification`} data-testid="organization-tab-swu-qualification">Sprint With Us qualification</Link></li>
          <li><Link href={`${base}?tab=twu-qualification`} data-testid="organization-tab-twu-qualification">Team With Us qualification</Link></li>
          <li><Link href={`${base}?tab=changelog`} data-testid="organization-tab-changelog">Changelog</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Organization</Heading>
        <Text elementType="p">Only the organization’s owner can change these details.</Text>
        <Text elementType="p" size="small" color="secondary">No logo has been added.</Text>
        <TextField label="Legal name" value="Northwind Digital Co-operative" isReadOnly data-testid="organization-legal-name-field" />
        <TextField label="Website" value="https://northwind.example.com" isReadOnly data-testid="organization-website-field" />
        <Heading level={3}>Address</Heading>
        <TextField label="Street address" value="100 Example Street" isReadOnly data-testid="organization-street-address-field" />
        <TextField label="Address line 2" value="" isReadOnly data-testid="organization-address-line-2-field" />
        <TextField label="City" value="Victoria" isReadOnly data-testid="organization-city-field" />
        <TextField label="Province or state" value="British Columbia" isReadOnly data-testid="organization-region-field" />
        <TextField label="Postal code or ZIP code" value="V0V 0V0" isReadOnly data-testid="organization-mail-code-field" />
        <TextField label="Country" value="Canada" isReadOnly data-testid="organization-country-field" />
        <Heading level={3}>Contact</Heading>
        <TextField label="Contact name" value="Test Vendor One" isReadOnly data-testid="organization-contact-name-field" />
        <TextField label="Contact title" value="Director" isReadOnly data-testid="organization-contact-title-field" />
        <TextField label="Contact email address" value="vendor1@example.com" isReadOnly data-testid="organization-contact-email-field" />
        <TextField label="Contact phone number" value="250-555-0100" isReadOnly data-testid="organization-contact-phone-field" />
      </section>
    </div>
  ),
};
