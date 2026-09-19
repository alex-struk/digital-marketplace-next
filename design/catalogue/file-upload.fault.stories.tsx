import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";

// file-upload · fault — a well-formed upload that fails because of the service itself (here, illustratively, storage
// that cannot be written). This is the one answer that is a fault of the service; R-8.17, R-8.18 and R-8.24 say that a
// submission that is the requester's error must never get it. Not a screen: the address answers with data. This
// response reference names the answer.
const meta: Meta = { title: "files/file-upload/fault" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const facts = { display: "grid", gap: "var(--layout-margin-medium)", margin: "var(--layout-margin-none)" } as const;
const fact = { display: "grid", gap: "var(--layout-margin-xsmall)" } as const;
const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { margin: "var(--layout-margin-none)" } as const;

export const Fault: StoryObj = {
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
        <dl style={facts} data-testid="file-upload-service-fault">
          <div style={fact}>
            <dt style={term}>Outcome</dt>
            <dd style={detail}>Failed: a fault of the service</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Message</dt>
            <dd style={detail}>The file could not be stored because of a problem with the service. Try again later.</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Stored</dt>
            <dd style={detail}>Nothing. The working copy has been removed, and the fault is recorded in the service's error log.</dd>
          </div>
        </dl>
      </section>
    </div>
  ),
};
