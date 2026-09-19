import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";

// file-upload · invalid-read-access — the read-access statement names a kind of access the service does not recognise;
// the upload is refused as a bad request reporting that the information was invalid, and nothing is stored (R-8.24).
// A statement that is missing, or is not well-formed data at all, gets the same answer with its own message (R-8.18).
// Not a screen: the address answers with data. This response reference names the answer.
const meta: Meta = { title: "files/file-upload/invalid-read-access" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const facts = { display: "grid", gap: "var(--layout-margin-medium)", margin: "var(--layout-margin-none)" } as const;
const fact = { display: "grid", gap: "var(--layout-margin-xsmall)" } as const;
const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { margin: "var(--layout-margin-none)" } as const;

export const InvalidReadAccess: StoryObj = {
  render: () => (
    <div style={page}>
      <div style={stack}>
        <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
        <Heading level={1}>Storing a file</Heading>
      </div>
      <section aria-labelledby="upload-request" style={stack}>
        <Heading level={2} id="upload-request">Request</Heading>
        <dl style={facts} data-testid="file-upload-request">
          <div style={fact}>
            <dt style={term}>Address</dt>
            <dd style={detail}>/api/files, sent by a signed-in person</dd>
          </div>
          <div style={fact}>
            <dt style={term}>The file</dt>
            <dd style={detail}>terms.pdf, 240 KB</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Name to store it under</dt>
            <dd style={detail}>terms.pdf</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Who may read it</dt>
            <dd style={detail}>A kind of access named "ministry", which the service does not recognise</dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="upload-answer" style={stack}>
        <Heading level={2} id="upload-answer">Answer</Heading>
        <dl style={facts} data-testid="file-upload-refused-read-access">
          <div style={fact}>
            <dt style={term}>Outcome</dt>
            <dd style={detail}>Refused: bad request</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Message</dt>
            <dd style={detail}>
              The read-access information provided was invalid: "ministry" is not a kind of access the service recognises.
            </dd>
          </div>
          <div style={fact}>
            <dt style={term}>Stored</dt>
            <dd style={detail}>Nothing. The working copy has been removed.</dd>
          </div>
        </dl>
      </section>
    </div>
  ),
};
