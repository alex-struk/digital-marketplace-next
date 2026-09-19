import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import { Button, ButtonGroup, Form, Heading, Text, TextField } from "@bcgov/design-system-react-components";

// organization-create · ready — every required field is valid and the optional ones are left empty, so Create is
// available; creating makes the vendor the owner and opens the new organization's page (R-3.22, R-3.23)
const meta: Meta = { title: "organizations/organization-create/ready" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const panel = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;

export const Ready: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Create Organization</Heading>
      <Text elementType="p">
        You will be the organization’s owner. Fields not marked “(optional)” are required.
      </Text>
      <Form validationBehavior="aria" style={stack}>
        <section aria-labelledby="org-details-heading" style={panel}>
          <Heading level={2} id="org-details-heading">Organization details</Heading>
          <Text elementType="p" size="small" color="secondary">No logo has been added.</Text>
          <div>
            <FileTrigger acceptedFileTypes={["image/*"]}>
              <Button variant="secondary" data-testid="organization-logo-button">Choose a logo (optional)</Button>
            </FileTrigger>
          </div>
          <TextField id="org-legal-name" label="Legal name" isRequired maxLength={100} description="Up to 100 characters." defaultValue="Northwind Digital Co-operative" data-testid="organization-legal-name-field" />
          <TextField id="org-website" label="Website (optional)" type="url" description="The full address, like https://example.com" data-testid="organization-website-field" />
        </section>
        <section aria-labelledby="org-address-heading" style={panel}>
          <Heading level={2} id="org-address-heading">Address</Heading>
          <TextField id="org-street" label="Street address" isRequired maxLength={100} defaultValue="100 Example Street" data-testid="organization-street-address-field" />
          <TextField id="org-street-2" label="Address line 2 (optional)" maxLength={100} data-testid="organization-address-line-2-field" />
          <TextField id="org-city" label="City" isRequired maxLength={100} defaultValue="Victoria" data-testid="organization-city-field" />
          <TextField id="org-region" label="Province or state" isRequired maxLength={100} defaultValue="British Columbia" data-testid="organization-region-field" />
          <TextField id="org-mail-code" label="Postal code or ZIP code" isRequired maxLength={100} defaultValue="V0V 0V0" data-testid="organization-mail-code-field" />
          <TextField id="org-country" label="Country" isRequired maxLength={100} defaultValue="Canada" data-testid="organization-country-field" />
        </section>
        <section aria-labelledby="org-contact-heading" style={panel}>
          <Heading level={2} id="org-contact-heading">Contact</Heading>
          <TextField id="org-contact-name" label="Contact name" isRequired maxLength={100} defaultValue="Test Vendor One" data-testid="organization-contact-name-field" />
          <TextField id="org-contact-title" label="Contact title (optional)" maxLength={100} data-testid="organization-contact-title-field" />
          <TextField id="org-contact-email" label="Contact email address" type="email" isRequired defaultValue="vendor1@example.com" data-testid="organization-contact-email-field" />
          <TextField id="org-contact-phone" label="Contact phone number (optional)" type="tel" data-testid="organization-contact-phone-field" />
        </section>
        <ButtonGroup ariaLabel="Organization actions">
          <Button type="submit" variant="primary" data-testid="organization-submit-button">Create organization</Button>
          <Button variant="secondary" data-testid="organization-create-cancel">Cancel</Button>
        </ButtonGroup>
      </Form>
    </div>
  ),
};
