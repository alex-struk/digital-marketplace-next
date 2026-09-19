import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";

// file-description · default — a person who may read a stored file asks for it without requesting its content, and
// receives its identifier, name, stored date and the identifier of the stored content it shares with any identical
// upload, but not the content itself (R-8.5, R-8.11). Not a screen: the address answers with data. This response
// reference names each part of the answer.
const meta: Meta = { title: "files/file-description/default" };
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
        <Heading level={1}>A stored file's description</Heading>
      </div>
      <section aria-labelledby="description-request" style={stack}>
        <Heading level={2} id="description-request">Request</Heading>
        <dl style={facts}>
          <div style={fact}>
            <dt style={term}>Address</dt>
            <dd style={detail}>/api/files/5b2e0c3a-8d41-4f6e-a1c2-000000000801, without requesting the content</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Asked by</dt>
            <dd style={detail}>A person who may read the file</dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="description-answer" style={stack}>
        <Heading level={2} id="description-answer">Answer</Heading>
        <dl style={facts} data-testid="file-description-answer">
          <div style={fact}>
            <dt style={term}>Identifier</dt>
            <dd style={detail} data-testid="file-description-id">5b2e0c3a-8d41-4f6e-a1c2-000000000801</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Name</dt>
            <dd style={detail} data-testid="file-description-name">terms.pdf</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Stored</dt>
            <dd style={detail} data-testid="file-description-stored-date">
              <time dateTime="2026-09-19T10:15:00-07:00">September 19, 2026 at 10:15 a.m.</time>
            </dd>
          </div>
          <div style={fact}>
            <dt style={term}>Stored content</dt>
            <dd style={detail} data-testid="file-description-content-id">
              9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
            </dd>
          </div>
          <div style={fact}>
            <dt style={term}>Content</dt>
            <dd style={detail}>Not included</dd>
          </div>
        </dl>
      </section>
    </div>
  ),
};
