import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";

// user-account-request · refused — somebody who is neither the account's owner nor an administrator asks for the
// account record and is refused rather than answered (R-4.25). In the interface the same refusal is shown as a
// missing page; here it is the answer itself. Not a screen: the address answers with data. This response reference
// names the answer.
const meta: Meta = { title: "users/user-account-request/refused" };
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
        <Heading level={1}>An account record</Heading>
      </div>
      <section aria-labelledby="user-account-request-request" style={stack}>
        <Heading level={2} id="user-account-request-request">Request</Heading>
        <dl style={facts}>
          <div style={fact}>
            <dt style={term}>Address</dt>
            <dd style={detail}>/api/users/7c1d9e42-3a5b-4f80-9e21-000000000401</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Asked by</dt>
            <dd style={detail}>Another vendor, who is neither the account's owner nor an administrator</dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="user-account-request-answer" style={stack}>
        <Heading level={2} id="user-account-request-answer">Answer</Heading>
        <dl style={facts} data-testid="user-account-refused">
          <div style={fact}>
            <dt style={term}>Outcome</dt>
            <dd style={detail} data-testid="user-account-refusal-status">Refused: not permitted</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Account record</dt>
            <dd style={detail}>None. The answer carries nothing from the account.</dd>
          </div>
        </dl>
      </section>
    </div>
  ),
};
