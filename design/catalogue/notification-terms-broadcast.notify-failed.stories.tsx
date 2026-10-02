import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, InlineAlert, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// notification-terms-broadcast · notify-failed — the administrator confirmed and the service refused or failed before
// reporting success. Vendors have not been told. The alert names no cause and makes no claim about whether any
// acceptance was withdrawn, because no criterion says (DESIGN.md, notifications gap 8). The button stays, so the
// administrator can try again.
const meta: Meta = { title: "notifications/notification-terms-broadcast/notify-failed" };
export default meta;

// The placeholder frame's border and inner padding are its own; its content is laid out by the stack.
const frame = {
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;

export const NotifyFailed: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Manage a page</Text>
          <Heading level={1}>Terms and conditions</Heading>
        </Stack>
        <section aria-labelledby="terms-content-heading" style={frame}>
          <Stack gap="medium">
            <Heading level={2} id="terms-content-heading">Page content</Heading>
            <Text elementType="p">Placeholder: the terms text and the page's editing controls are designed by the content domain.</Text>
          </Stack>
        </section>
        <Stack as="section" gap="medium" aria-labelledby="notify-vendors-heading">
          <Heading level={2} id="notify-vendors-heading">Notify vendors of updated terms</Heading>
          <div data-testid="notify-vendors-failure">
            <InlineAlert
              variant="danger"
              role="alert"
              title="Vendors have not been notified"
              description="The service could not complete the announcement. Try again."
            />
          </div>
          <Text elementType="p">
            Use this once the changed terms are published. Every vendor's acceptance of the terms is withdrawn, and each active
            vendor is emailed asking them to read and accept the new terms. Until they accept, they cannot submit proposals to
            Code With Us, Sprint With Us or Team With Us.
          </Text>
          <Text elementType="p">
            Deactivated vendors are not emailed. Their acceptance is withdrawn too, and they will find the change when they
            next sign in.
          </Text>
          <div>
            <Button variant="secondary" data-testid="notify-vendors-button">Notify vendors of updated terms</Button>
          </div>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
