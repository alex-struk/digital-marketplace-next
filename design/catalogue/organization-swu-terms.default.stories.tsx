import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// organization-swu-terms · default — the owner reading the Sprint With Us terms for an organization that has not
// accepted them, with Accept offered (R-3.25, R-3.27)
const meta: Meta = { title: "organizations/organization-swu-terms/default" };
export default meta;

const panel = {
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Northwind Digital Co-operative</Text>
          <Heading level={1}>Sprint With Us Terms &amp; Conditions</Heading>
        </Stack>
        <section aria-labelledby="terms-heading" style={panel} data-testid="organization-terms-body">
          <Stack gap="medium">
            <Heading level={2} id="terms-heading">Terms and conditions</Heading>
            <Text elementType="p">[Sprint With Us terms and conditions text, supplied by the service.]</Text>
          </Stack>
        </section>
        <Stack gap="medium">
          <Text elementType="p">
            By accepting, you agree to these terms on behalf of Northwind Digital Co-operative. They are accepted once for the organization.
          </Text>
          <ButtonGroup ariaLabel="Terms actions">
            <Button variant="primary" data-testid="organization-accept-terms-button">Accept terms and conditions</Button>
            <Button variant="secondary" data-testid="organization-terms-cancel">Cancel</Button>
          </ButtonGroup>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
