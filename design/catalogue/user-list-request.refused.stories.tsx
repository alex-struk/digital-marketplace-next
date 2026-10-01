import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";

// user-list-request · refused — a public sector employee who is not an administrator, a vendor, or a visitor who is
// not signed in asks for the list of everyone registered and is refused rather than answered, so no email address or
// account status is disclosed (R-4.21). Not a screen: the address answers with data. This response reference names
// the answer.
const meta: Meta = { title: "users/user-list-request/refused" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const facts = { display: "grid", gap: "var(--layout-margin-medium)", margin: "var(--layout-margin-none)" } as const;
const fact = { display: "grid", gap: "var(--layout-margin-xsmall)" } as const;
const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { margin: "var(--layout-margin-none)", overflowWrap: "anywhere" } as const;

export const Refused: StoryObj = {
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
            <dd style={detail}>Anyone but an administrator, signed in or not</dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="user-list-request-answer" style={stack}>
        <Heading level={2} id="user-list-request-answer">Answer</Heading>
        <dl style={facts} data-testid="user-list-request-refused">
          <div style={fact}>
            <dt style={term}>Outcome</dt>
            <dd style={detail} data-testid="user-list-request-refusal-status">Refused: not permitted</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Accounts</dt>
            <dd style={detail}>None. The answer carries no account, email address or account status.</dd>
          </div>
        </dl>
      </section>
    </div>
  ),
};
