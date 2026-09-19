import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import { Button, ButtonGroup, Form, Heading, Text, TextField } from "@bcgov/design-system-react-components";

// organization-create · default — a vendor who has accepted the terms opens a blank registration form; Create stays
// unavailable, with the reason stated, until every required field is valid (R-3.2, R-3.22, R-3.23)
const meta: Meta = { title: "organizations/organization-create/default" };
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

export const Default: StoryObj = {
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
          <TextField id="org-legal-name" label="Legal name" isRequired maxLength={100} description="Up to 100 characters." data-testid="organization-legal-name-field" />
          <TextField id="org-website" label="Website (optional)" type="url" description="The full address, like https://example.com" data-testid="organization-website-field" />
        </section>
        <section aria-labelledby="org-address-heading" style={panel}>
          <Heading level={2} id="org-address-heading">Address</Heading>
          <TextField id="org-street" label="Street address" isRequired maxLength={100} data-testid="organization-street-address-field" />
          <TextField id="org-street-2" label="Address line 2 (optional)" maxLength={100} data-testid="organization-address-line-2-field" />
          <TextField id="org-city" label="City" isRequired maxLength={100} data-testid="organization-city-field" />
          <TextField id="org-region" label="Province or state" isRequired maxLength={100} data-testid="organization-region-field" />
          <TextField id="org-mail-code" label="Postal code or ZIP code" isRequired maxLength={100} data-testid="organization-mail-code-field" />
          <TextField id="org-country" label="Country" isRequired maxLength={100} data-testid="organization-country-field" />
        </section>
        <section aria-labelledby="org-contact-heading" style={panel}>
          <Heading level={2} id="org-contact-heading">Contact</Heading>
          <TextField id="org-contact-name" label="Contact name" isRequired maxLength={100} data-testid="organization-contact-name-field" />
          <TextField id="org-contact-title" label="Contact title (optional)" maxLength={100} data-testid="organization-contact-title-field" />
          <TextField id="org-contact-email" label="Contact email address" type="email" isRequired data-testid="organization-contact-email-field" />
          <TextField id="org-contact-phone" label="Contact phone number (optional)" type="tel" data-testid="organization-contact-phone-field" />
        </section>
        <Text id="org-submit-hint" elementType="p" size="small" color="secondary">
          Fill in every required field to create the organization.
        </Text>
        <ButtonGroup ariaLabel="Organization actions">
          <Button type="submit" variant="primary" isDisabled aria-describedby="org-submit-hint" data-testid="organization-submit-button">
            Create organization
          </Button>
          <Button variant="secondary" data-testid="organization-create-cancel">Cancel</Button>
        </ButtonGroup>
      </Form>
    </div>
  ),
};
