import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Text } from "@bcgov/design-system-react-components";

// organization-swu-terms · administrator — a service administrator reading the terms of an organization that has not
// accepted them: they are not offered Accept, because acceptance is the organization's own act (R-3.27)
const meta: Meta = { title: "organizations/organization-swu-terms/administrator" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const panel = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;

export const Administrator: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Northwind Digital Co-operative</Text>
      <Heading level={1}>Sprint With Us Terms &amp; Conditions</Heading>
      <Text elementType="p">Northwind Digital Co-operative has not accepted these terms. Only the organization’s own people can accept them.</Text>
      <section aria-labelledby="terms-heading" style={panel} data-testid="organization-terms-body">
        <Heading level={2} id="terms-heading">Terms and conditions</Heading>
        <Text elementType="p">[Sprint With Us terms and conditions text, supplied by the service.]</Text>
      </section>
      <div>
        <Button variant="secondary" data-testid="organization-terms-cancel">Back to the organization</Button>
      </div>
    </div>
  ),
};
