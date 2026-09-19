import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, InlineAlert, Text } from "@bcgov/design-system-react-components";

// notification-terms-broadcast · notify-failed — the administrator confirmed and the service refused or failed before
// reporting success. Vendors have not been told. The alert names no cause and makes no claim about whether any
// acceptance was withdrawn, because no criterion says (DESIGN.md, notifications gap 8). The button stays, so the
// administrator can try again.
const meta: Meta = { title: "notifications/notification-terms-broadcast/notify-failed" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const frame = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;

export const NotifyFailed: StoryObj = {
  render: () => (
    <div style={page}>
      <div style={stack}>
        <Text elementType="p" size="small" color="secondary">Manage a page</Text>
        <Heading level={1}>Terms and conditions</Heading>
      </div>
      <section aria-labelledby="terms-content-heading" style={frame}>
        <Heading level={2} id="terms-content-heading">Page content</Heading>
        <Text elementType="p">Placeholder: the terms text and the page's editing controls are designed by the content domain.</Text>
      </section>
      <section aria-labelledby="notify-vendors-heading" style={stack}>
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
      </section>
    </div>
  ),
};
