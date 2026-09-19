import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// content-service-level-agreement-link · default — the Code With Us learn-more screen, where the service level
// agreement link sits beside the program's cost. The link leads to the page the service creates for itself at
// "service-level-agreement", so it resolves on a fresh installation (R-7.18). The rest of the learn-more screen is not
// designed by this domain and is shown only as a placeholder frame.
const meta: Meta = { title: "content/content-service-level-agreement-link/default" };
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

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Code With Us</Heading>
      <section aria-labelledby="learn-more-placeholder-heading" style={frame}>
        <Heading level={2} id="learn-more-placeholder-heading">How Code With Us works</Heading>
        <Text elementType="p">Placeholder: the learn-more screen's own content is not designed by the content domain.</Text>
      </section>
      <section aria-labelledby="cost-heading" style={stack}>
        <Heading level={2} id="cost-heading">What it costs</Heading>
        <Text elementType="p">Placeholder: the program's cost, as the learn-more screen states it.</Text>
        <Text elementType="p">
          What the service commits to, and what it asks of you, is set out in the{" "}
          <Link href="/content/service-level-agreement" data-testid="service-level-agreement-link">
            service level agreement
          </Link>
          .
        </Text>
      </section>
    </div>
  ),
};
