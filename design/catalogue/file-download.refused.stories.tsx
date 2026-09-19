import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";

// file-download · refused — a second vendor asks for the content of a file another vendor uploaded and marked readable
// by no one else, or for an identifier no file carries; both are answered as not authorized and no content is sent
// (R-8.7, R-8.12, R-8.25). Not a screen: the address answers with data. This response reference names the answer.
const meta: Meta = { title: "files/file-download/refused" };
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
        <Text elementType="p" size="small" color="secondary">Response reference: this address answers with the file, not a page</Text>
        <Heading level={1}>A stored file</Heading>
      </div>
      <section aria-labelledby="download-request" style={stack}>
        <Heading level={2} id="download-request">Request</Heading>
        <dl style={facts} data-testid="file-download-request">
          <div style={fact}>
            <dt style={term}>Address</dt>
            <dd style={detail}>/api/files/5b2e0c3a-8d41-4f6e-a1c2-000000000802?type=blob</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Asked by</dt>
            <dd style={detail}>A vendor who did not upload the file and is given no way to read it</dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="download-answer" style={stack}>
        <Heading level={2} id="download-answer">Answer</Heading>
        <dl style={facts} data-testid="file-refused">
          <div style={fact}>
            <dt style={term}>Outcome</dt>
            <dd style={detail}>Refused: not authorized</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Message</dt>
            <dd style={detail}>You are not authorized to read this file.</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Same answer when</dt>
            <dd style={detail}>No stored file has the identifier asked for, or the identifier is malformed</dd>
          </div>
        </dl>
      </section>
    </div>
  ),
};
