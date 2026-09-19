import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Text } from "@bcgov/design-system-react-components";

// organization-swu-terms · accepted — the terms have been accepted for this organization: the date is stated and
// Accept is not offered again (R-3.27)
const meta: Meta = { title: "organizations/organization-swu-terms/accepted" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const panel = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;

export const Accepted: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Northwind Digital Co-operative</Text>
      <Heading level={1}>Sprint With Us Terms &amp; Conditions</Heading>
      <Text elementType="p" data-testid="organization-terms-accepted-on">
        Northwind Digital Co-operative accepted these terms on September 1, 2026 at 10:30 a.m.
      </Text>
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
