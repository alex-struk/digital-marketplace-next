import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Link, Text, TextField } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// organization-edit · logo-stored — the owner on the Organization tab after saving a logo: the form is closed and the
// stored logo is shown at its stored size, read from the address the service gives it (R-8.13, R-8.28). It is the
// default story with a logo in place of "No logo has been added."
const meta: Meta = { title: "organizations/organization-edit/logo-stored" };
export default meta;

const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
// Keeps a logo inside its column. Not spacing: the files domain's image rule (see DESIGN.md, files, gap 11).
const image = { maxWidth: "100%", height: "auto" } as const;
const orgId = "4a9e1c20-6d3b-4f1a-8e2c-000000000201";
const base = `/organizations/${orgId}/edit`;

export const LogoStored: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Edit Organization</Text>
          <Heading level={1}>Northwind Digital Co-operative</Heading>
        </Stack>
        <Stack direction="row" align="center" gap="medium">
          <span style={badge} data-testid="organization-swu-qualified-badge">Sprint With Us qualified</span>
          <span style={badge} data-testid="organization-twu-qualified-badge">Team With Us qualified</span>
          <Text elementType="p" size="small" color="secondary">
            Organization ID: <span data-testid="organization-identifier">{orgId}</span>
          </Text>
        </Stack>
        <nav aria-label="Organization sections">
          <Stack as="ul" direction="row" gap="medium" align="center">
            <li><Link href={`${base}?tab=organization`} aria-current="page" data-testid="organization-tab-organization">Organization</Link></li>
            <li><Link href={`${base}?tab=team`} data-testid="organization-tab-team">Team members</Link></li>
            <li><Link href={`${base}?tab=swu-qualification`} data-testid="organization-tab-swu-qualification">Sprint With Us qualification</Link></li>
            <li><Link href={`${base}?tab=twu-qualification`} data-testid="organization-tab-twu-qualification">Team With Us qualification</Link></li>
            <li><Link href={`${base}?tab=changelog`} data-testid="organization-tab-changelog">Changelog</Link></li>
          </Stack>
        </nav>
        <Stack as="section" aria-labelledby="tab-heading" gap="medium">
          <Heading level={2} id="tab-heading">Organization</Heading>
          <div>
            <Button variant="primary" data-testid="organization-edit-button">Edit organization</Button>
          </div>
          <Stack role="group" aria-labelledby="logo-label" gap="small" align="start">
            <Text elementType="p" id="logo-label">Logo</Text>
            <img
              src="/api/files/5b2e0c3a-8d41-4f6e-a1c2-000000000811?type=blob"
              alt="Northwind Digital Co-operative logo"
              style={image}
              data-testid="organization-current-logo"
            />
          </Stack>
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
        </Stack>
        <Stack as="section" aria-labelledby="archive-heading" gap="medium">
          <Heading level={2} id="archive-heading">Archive this organization</Heading>
          <Text elementType="p">
            An archived organization leaves the organization list and its members’ lists of organizations, and can no longer be used on proposals. Its records are kept.
          </Text>
          <div>
            <Button variant="secondary" danger data-testid="organization-archive-button">Archive organization</Button>
          </div>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
