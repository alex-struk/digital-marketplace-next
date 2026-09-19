import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import { Button, ButtonGroup, Form, Heading, InlineAlert, Link, Text, TextField } from "@bcgov/design-system-react-components";

// organization-edit · invalid — the owner cleared the city and typed a malformed website; each field says what is
// wrong, the list before the buttons repeats it, and Save stays unavailable until both are fixed (R-3.22)
const meta: Meta = { title: "organizations/organization-edit/invalid" };
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

export const Invalid: StoryObj = {
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
      <Form validationBehavior="aria" style={stack}>
        <Heading level={2} id="tab-heading">Edit organization</Heading>
        <Text elementType="p">Fields not marked “(optional)” are required.</Text>
        <Text elementType="p" size="small" color="secondary">No logo has been added.</Text>
        <div>
          <FileTrigger acceptedFileTypes={["image/*"]}>
            <Button variant="secondary" data-testid="organization-logo-button">Choose a logo (optional)</Button>
          </FileTrigger>
        </div>
        <TextField id="org-legal-name" label="Legal name" isRequired maxLength={100} description="Up to 100 characters." defaultValue="Northwind Digital Co-operative" data-testid="organization-legal-name-field" />
        <TextField
          id="org-website"
          label="Website (optional)"
          type="url"
          description="The full address, like https://example.com"
          defaultValue="northwind"
          isInvalid
          errorMessage="Enter the full website address, like https://example.com, or leave it blank"
          data-testid="organization-website-field"
        />
        <Heading level={3}>Address</Heading>
        <TextField id="org-street" label="Street address" isRequired maxLength={100} defaultValue="100 Example Street" data-testid="organization-street-address-field" />
        <TextField id="org-street-2" label="Address line 2 (optional)" maxLength={100} data-testid="organization-address-line-2-field" />
        <TextField id="org-city" label="City" isRequired maxLength={100} defaultValue="" isInvalid errorMessage="Enter the city" data-testid="organization-city-field" />
        <TextField id="org-region" label="Province or state" isRequired maxLength={100} defaultValue="British Columbia" data-testid="organization-region-field" />
        <TextField id="org-mail-code" label="Postal code or ZIP code" isRequired maxLength={100} defaultValue="V0V 0V0" data-testid="organization-mail-code-field" />
        <TextField id="org-country" label="Country" isRequired maxLength={100} defaultValue="Canada" data-testid="organization-country-field" />
        <Heading level={3}>Contact</Heading>
        <TextField id="org-contact-name" label="Contact name" isRequired maxLength={100} defaultValue="Test Vendor One" data-testid="organization-contact-name-field" />
        <TextField id="org-contact-title" label="Contact title (optional)" maxLength={100} defaultValue="Director" data-testid="organization-contact-title-field" />
        <TextField id="org-contact-email" label="Contact email address" type="email" isRequired defaultValue="vendor1@example.com" data-testid="organization-contact-email-field" />
        <TextField
          id="org-contact-phone"
          label="Contact phone number (optional)"
          type="tel"
          description="Clear this field to remove the number."
          defaultValue="250-555-0100"
          data-testid="organization-contact-phone-field"
        />
        <div id="org-save-hint">
          <InlineAlert variant="danger" title="Fix 2 fields to save your changes">
            <ul>
              <li data-testid="field-error">
                <Link href="#org-website">Website: enter the full website address, like https://example.com, or leave it blank</Link>
              </li>
              <li data-testid="field-error"><Link href="#org-city">City: enter the city</Link></li>
            </ul>
          </InlineAlert>
        </div>
        <ButtonGroup ariaLabel="Organization actions">
          <Button type="submit" variant="primary" isDisabled aria-describedby="org-save-hint" data-testid="organization-save-button">
            Save changes
          </Button>
          <Button variant="secondary" data-testid="organization-cancel-edit-button">Cancel</Button>
        </ButtonGroup>
      </Form>
    </div>
  ),
};
