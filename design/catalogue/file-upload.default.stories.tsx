import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";

// file-upload · default — a signed-in person submits one file, a name and a read-access statement together, and the
// service answers with the stored file's record: its identifier, its name and the date it was stored (R-8.1, R-8.2,
// R-8.6). Not a screen: the address answers with data. This response reference names each part of the answer.
const meta: Meta = { title: "files/file-upload/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const facts = { display: "grid", gap: "var(--layout-margin-medium)", margin: "var(--layout-margin-none)" } as const;
const fact = { display: "grid", gap: "var(--layout-margin-xsmall)" } as const;
const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { margin: "var(--layout-margin-none)" } as const;

export const Default: StoryObj = {
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
            <dd style={detail}>/api/files, sent by a signed-in person as one submission</dd>
          </div>
          <div style={fact}>
            <dt style={term}>The file</dt>
            <dd style={detail}>terms.pdf, 240 KB, its size declared in advance</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Name to store it under</dt>
            <dd style={detail}>terms.pdf</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Who may read it</dt>
            <dd style={detail}>Anyone</dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="upload-answer" style={stack}>
        <Heading level={2} id="upload-answer">Answer</Heading>
        <dl style={facts} data-testid="file-upload-stored">
          <div style={fact}>
            <dt style={term}>Outcome</dt>
            <dd style={detail}>Stored</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Identifier</dt>
            <dd style={detail} data-testid="file-upload-stored-id">5b2e0c3a-8d41-4f6e-a1c2-000000000801</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Name</dt>
            <dd style={detail}>terms.pdf</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Stored</dt>
            <dd style={detail}><time dateTime="2026-09-19T10:15:00-07:00">September 19, 2026 at 10:15 a.m.</time></dd>
          </div>
        </dl>
      </section>
    </div>
  ),
};
