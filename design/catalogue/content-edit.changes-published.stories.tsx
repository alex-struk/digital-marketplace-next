import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, InlineAlert, Link, Text, TextArea, TextField } from "@bcgov/design-system-react-components";

// content-edit · changes-published — the administrator confirmed publishing a change to the body. The screen returns to
// its read-only form with the new wording, the updated date is the moment of the change and the last editor is the
// person who made it (R-7.8, R-7.27). The replaced wording is kept as an earlier version but nothing here shows it (R-7.23).
const meta: Meta = { title: "content/content-edit/changes-published" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const facts = { display: "flex", flexWrap: "wrap", gap: "var(--layout-margin-large)", margin: "var(--layout-margin-none)" } as const;
const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const definition = { margin: "var(--layout-margin-none)" } as const;

export const ChangesPublished: StoryObj = {
  render: () => (
    <div style={page}>
      <div style={stack}>
        <Text elementType="p" size="small" color="secondary">Manage a page</Text>
        <Heading level={1}>Hackathon rules</Heading>
      </div>
      <div data-testid="content-changes-published-success">
        <InlineAlert variant="success" role="status" title="Changes published">
          <Text elementType="p">Readers of /content/hackathon-rules now see the new wording.</Text>
        </InlineAlert>
      </div>
      <dl style={facts}>
        <div>
          <dt style={term}>Public address</dt>
          <dd style={definition}><Link href="/content/hackathon-rules" data-testid="content-page-address">/content/hackathon-rules</Link></dd>
        </div>
        <div>
          <dt style={term}>Published</dt>
          <dd style={definition}><time dateTime="2026-08-03" data-testid="content-published-date">August 3, 2026</time></dd>
        </div>
        <div>
          <dt style={term}>Published by</dt>
          <dd style={definition}><Link href="/users/0b6f2c1e-5a7d-4c3e-9f10-000000000001" data-testid="content-published-by">Test Administrator</Link></dd>
        </div>
        <div>
          <dt style={term}>Last updated</dt>
          <dd style={definition}><time dateTime="2026-09-19" data-testid="content-updated-date">September 19, 2026</time></dd>
        </div>
        <div>
          <dt style={term}>Last updated by</dt>
          <dd style={definition}><Link href="/users/0b6f2c1e-5a7d-4c3e-9f10-000000000006" data-testid="content-updated-by">Test Administrator Two</Link></dd>
        </div>
      </dl>
      <ButtonGroup ariaLabel="Page actions">
        <Button variant="primary" data-testid="content-edit-button">Edit page</Button>
        <Button variant="secondary" danger data-testid="content-delete-button">Delete page</Button>
      </ButtonGroup>
      <section aria-labelledby="content-current-heading" style={stack}>
        <Heading level={2} id="content-current-heading">Current wording</Heading>
        <TextField label="Title" isReadOnly defaultValue="Hackathon rules" data-testid="content-title-field" />
        <TextField label="Address" isReadOnly defaultValue="hackathon-rules" data-testid="content-slug-field" />
        <TextArea
          label="Body"
          isReadOnly
          defaultValue="Placeholder: the revised rules of the hackathon, written by an administrator."
          data-testid="content-body-field"
        />
      </section>
    </div>
  ),
};
