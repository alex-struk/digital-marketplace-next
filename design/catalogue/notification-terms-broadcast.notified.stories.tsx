import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, InlineAlert, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// notification-terms-broadcast · notified — the administrator confirmed. The service reports success as soon as every
// acceptance is withdrawn, while the emails are still being sent (R-6.24), and nothing later reports whether each one
// arrived (R-6.2). The wording says exactly that, so the administrator is not told more than the service knows.
const meta: Meta = { title: "notifications/notification-terms-broadcast/notified" };
export default meta;

// The placeholder frame's border and inner padding are its own; its content is laid out by the stack.
const frame = {
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;

export const Notified: StoryObj = {
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
          <div data-testid="notify-vendors-success">
            <InlineAlert
              variant="success"
              role="status"
              title="Vendors have been notified"
              description="Every vendor's acceptance of the terms has been withdrawn. Emails asking active vendors to read and accept the new terms are being sent now. This page will not report whether each email arrives."
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
