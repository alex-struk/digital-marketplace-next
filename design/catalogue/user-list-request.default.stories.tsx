import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";

// user-list-request · default — an administrator asks for the list of everyone registered with the service and is
// answered with every account, each with its email address and account status (R-4.14, R-4.21). Not a screen: the
// address answers with data. This response reference names each part of the answer.
const meta: Meta = { title: "users/user-list-request/default" };
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
        <Heading level={1}>Everyone registered with the service</Heading>
      </div>
      <section aria-labelledby="user-list-request-request" style={stack}>
        <Heading level={2} id="user-list-request-request">Request</Heading>
        <dl style={facts}>
          <div style={fact}>
            <dt style={term}>Address</dt>
            <dd style={detail}>/api/users</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Asked by</dt>
            <dd style={detail}>An administrator</dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="user-list-request-answer" style={stack}>
        <Heading level={2} id="user-list-request-answer">Answer</Heading>
        <dl style={facts} data-testid="user-list-request-accounts">
          <div style={fact}>
            <dt style={term}>Outcome</dt>
            <dd style={detail}>Answered</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Accounts</dt>
            <dd style={detail}>
              Every registered account, active and deactivated, each with its identifier, name, email address, account
              kind, account status and whether it is an administrator
            </dd>
          </div>
        </dl>
      </section>
    </div>
  ),
};
