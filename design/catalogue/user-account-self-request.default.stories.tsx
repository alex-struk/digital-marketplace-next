import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";

// user-account-self-request · default — a signed-in person asks for their own account record and is answered with it,
// including the moment new-opportunity notices were turned on, or nothing when they are off (R-4.24, R-4.29). Not a
// screen: the address answers with data. This response reference names each part of the answer.
const meta: Meta = { title: "users/user-account-self-request/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const facts = { display: "grid", gap: "var(--layout-margin-medium)", margin: "var(--layout-margin-none)" } as const;
const fact = { display: "grid", gap: "var(--layout-margin-xsmall)" } as const;
const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { margin: "var(--layout-margin-none)", overflowWrap: "anywhere" } as const;

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <div style={stack}>
        <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
        <Heading level={1}>One's own account record</Heading>
      </div>
      <section aria-labelledby="user-account-self-request-request" style={stack}>
        <Heading level={2} id="user-account-self-request-request">Request</Heading>
        <dl style={facts}>
          <div style={fact}>
            <dt style={term}>Address</dt>
            <dd style={detail}>/api/sessions/current</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Asked by</dt>
            <dd style={detail}>A signed-in vendor who is being told about new opportunities</dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="user-account-self-request-answer" style={stack}>
        <Heading level={2} id="user-account-self-request-answer">Answer</Heading>
        <dl style={facts}>
          <div style={fact}>
            <dt style={term}>Account identifier</dt>
            <dd style={detail} data-testid="user-account-self-id">7c1d9e42-3a5b-4f80-9e21-000000000401</dd>
          </div>
          <div style={fact}>
            <dt style={term}>New-opportunity notices since</dt>
            <dd style={detail} data-testid="user-account-self-notices-since">
              2026-09-14T17:05:22.000Z. Empty when notices are off: turning them off clears the moment rather than
              recording when.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  ),
};
