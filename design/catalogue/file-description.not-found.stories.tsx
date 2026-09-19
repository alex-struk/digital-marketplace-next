import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";

// file-description · not-found — an administrator asks for an identifier no stored file carries and is told it was not
// found; anyone else asking the same is answered as in file-description · refused (R-8.12). Not a screen: the address
// answers with data. This response reference names the answer.
const meta: Meta = { title: "files/file-description/not-found" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const facts = { display: "grid", gap: "var(--layout-margin-medium)", margin: "var(--layout-margin-none)" } as const;
const fact = { display: "grid", gap: "var(--layout-margin-xsmall)" } as const;
const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { margin: "var(--layout-margin-none)", overflowWrap: "anywhere" } as const;

export const NotFound: StoryObj = {
  render: () => (
    <div style={page}>
      <div style={stack}>
        <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
        <Heading level={1}>A stored file's description</Heading>
      </div>
      <section aria-labelledby="description-request" style={stack}>
        <Heading level={2} id="description-request">Request</Heading>
        <dl style={facts}>
          <div style={fact}>
            <dt style={term}>Address</dt>
            <dd style={detail}>/api/files/00000000-0000-4000-8000-000000000000, without requesting the content</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Asked by</dt>
            <dd style={detail}>An administrator</dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="description-answer" style={stack}>
        <Heading level={2} id="description-answer">Answer</Heading>
        <dl style={facts} data-testid="file-not-found">
          <div style={fact}>
            <dt style={term}>Outcome</dt>
            <dd style={detail}>Not found</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Message</dt>
            <dd style={detail}>No stored file has this identifier.</dd>
          </div>
        </dl>
      </section>
    </div>
  ),
};
