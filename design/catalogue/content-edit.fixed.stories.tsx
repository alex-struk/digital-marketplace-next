import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, InlineAlert, Link, Text, TextArea, TextField } from "@bcgov/design-system-react-components";

// content-edit · fixed — an administrator on the managing screen of "about", a page the service needs and created for
// itself, never edited. A warning says the service needs it at this address; no Delete page is offered (R-7.25). It still
// carries its stub wording and its address as its title (R-7.12), and names "System" as publisher and last editor (R-7.27).
const meta: Meta = { title: "content/content-edit/fixed" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const facts = { display: "flex", flexWrap: "wrap", gap: "var(--layout-margin-large)", margin: "var(--layout-margin-none)" } as const;
const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const definition = { margin: "var(--layout-margin-none)" } as const;

export const Fixed: StoryObj = {
  render: () => (
    <div style={page}>
      <div style={stack}>
        <Text elementType="p" size="small" color="secondary">Manage a page</Text>
        <Heading level={1}>about</Heading>
        <dl style={facts}>
          <div>
            <dt style={term}>Public address</dt>
            <dd style={definition}><Link href="/content/about" data-testid="content-page-address">/content/about</Link></dd>
          </div>
          <div>
            <dt style={term}>Published</dt>
            <dd style={definition}><time dateTime="2020-12-02" data-testid="content-published-date">December 2, 2020</time></dd>
          </div>
          <div>
            <dt style={term}>Published by</dt>
            <dd style={definition}><span data-testid="content-published-by">System</span></dd>
          </div>
          <div>
            <dt style={term}>Last updated</dt>
            <dd style={definition}><time dateTime="2020-12-02" data-testid="content-updated-date">December 2, 2020</time></dd>
          </div>
          <div>
            <dt style={term}>Last updated by</dt>
            <dd style={definition}><span data-testid="content-updated-by">System</span></dd>
          </div>
        </dl>
      </div>
      <div data-testid="content-fixed-page-warning">
        <InlineAlert variant="warning" title="The service needs this page">
          <Text elementType="p">
            Parts of the service link to this page or show its text, so it must stay at /content/about. You can change its
            title and body, but you cannot change its address or delete it.
          </Text>
        </InlineAlert>
      </div>
      <ButtonGroup ariaLabel="Page actions">
        <Button variant="primary" data-testid="content-edit-button">Edit page</Button>
      </ButtonGroup>
      <section aria-labelledby="content-current-heading" style={stack}>
        <Heading level={2} id="content-current-heading">Current wording</Heading>
        <TextField label="Title" isReadOnly defaultValue="about" data-testid="content-title-field" />
        <TextField label="Address" isReadOnly defaultValue="about" data-testid="content-slug-field" />
        <TextArea label="Body" isReadOnly defaultValue="Initial version" data-testid="content-body-field" />
      </section>
    </div>
  ),
};
