import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import { Button, ButtonGroup, Form, Heading, InlineAlert, Link, Text, TextField } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// organization-edit · logo-refused — the owner chose "northwind.gif" through the chooser's "all files" option and
// saved. The logo is refused because its name does not end in .jpg, .jpeg or .png (R-8.30); a file whose name is
// allowed but whose content is not a JPEG or PNG image is refused in the same place (R-8.21). Nothing is stored, the
// stored logo is kept, the form stays open with what was typed, and focus moves to the message. The picker is the files
// domain's image picker with "Logo" in place of "Profile picture".
const meta: Meta = { title: "organizations/organization-edit/logo-refused" };
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

export const LogoRefused: StoryObj = {
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
        <Form validationBehavior="aria">
          <Stack gap="medium">
            <Heading level={2} id="tab-heading">Edit organization</Heading>
            <Text elementType="p">Fields not marked “(optional)” are required.</Text>
            <Stack role="group" aria-labelledby="logo-label" gap="small" align="start">
              <Text elementType="p" id="logo-label">Logo (optional)</Text>
              <img
                src="/api/files/5b2e0c3a-8d41-4f6e-a1c2-000000000811?type=blob"
                alt="Northwind Digital Co-operative logo"
                style={image}
              />
              <div data-testid="organization-logo-refused-error" tabIndex={-1}>
                <InlineAlert variant="danger" role="alert" title="northwind.gif cannot be used as a logo">
                  <Text elementType="p">
                    Choose a JPEG or PNG image. Its name must end in .jpg, .jpeg or .png. The current logo has been kept.
                  </Text>
                </InlineAlert>
              </div>
              <div id="logo-file-rule">
                <Text elementType="p" size="small" color="secondary">
                  A JPEG or PNG image, up to 10 MB. A logo wider or taller than 500 pixels is made smaller to fit, keeping its
                  proportions. Anyone can see the logo, including people who are not signed in.
                </Text>
              </div>
              <FileTrigger acceptedFileTypes={["image/jpeg", "image/png"]}>
                <Button variant="secondary" aria-describedby="logo-file-rule" data-testid="organization-logo-button">
                  Choose a different logo
                </Button>
              </FileTrigger>
            </Stack>
            <TextField id="org-legal-name" label="Legal name" isRequired maxLength={100} description="Up to 100 characters." defaultValue="Northwind Digital Co-operative" data-testid="organization-legal-name-field" />
            <TextField id="org-website" label="Website (optional)" type="url" description="The full address, like https://example.com" defaultValue="https://northwind.example.com" data-testid="organization-website-field" />
            <Heading level={3}>Address</Heading>
            <TextField id="org-street" label="Street address" isRequired maxLength={100} defaultValue="100 Example Street" data-testid="organization-street-address-field" />
            <TextField id="org-street-2" label="Address line 2 (optional)" maxLength={100} data-testid="organization-address-line-2-field" />
            <TextField id="org-city" label="City" isRequired maxLength={100} defaultValue="Victoria" data-testid="organization-city-field" />
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
            <ButtonGroup ariaLabel="Organization actions">
              <Button type="submit" variant="primary" data-testid="organization-save-button">Save changes</Button>
              <Button variant="secondary" data-testid="organization-cancel-edit-button">Cancel</Button>
            </ButtonGroup>
          </Stack>
        </Form>
      </Stack>
    </PageContainer>
  ),
};
