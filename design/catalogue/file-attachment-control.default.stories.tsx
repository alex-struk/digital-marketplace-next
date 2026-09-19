import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import { Button, Heading, Link, Text, TextField } from "@bcgov/design-system-react-components";

// file-attachment-control · default — the Attachments part of the Opportunity tab in edit mode, holding two attachments
// that are already stored. Their names are read-only (R-8.27 note), each can be downloaded from the address it is
// stored at (R-8.10) and removed, and the size limit is stated before a file is chosen (R-8.17). The rest of the form
// is the opportunities domain's (opportunity-*-edit · editing) and is trimmed here.
const meta: Meta = { title: "files/file-attachment-control/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--layout-margin-medium)" } as const;
const panel = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const list = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  listStyle: "none",
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-none)",
} as const;
const item = {
  display: "grid",
  gap: "var(--layout-margin-small)",
  padding: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const tabs = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--layout-margin-large)",
  listStyle: "none",
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-none)",
} as const;
const base = "/opportunities/code-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000101/edit";

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a Code With Us opportunity</Text>
      <Heading level={1}>Build an accessible permit tracker</Heading>
      <nav aria-label="Opportunity sections">
        <ul style={tabs}>
          <li><Link href={`${base}?tab=summary`}>Summary</Link></li>
          <li><Link href={`${base}?tab=opportunity`} aria-current="page">Opportunity</Link></li>
          <li><Link href={`${base}?tab=addenda`}>Addenda</Link></li>
          <li><Link href={`${base}?tab=history`}>History</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Opportunity</Heading>
        <Text elementType="p" size="small" color="secondary">
          The overview, description, details and key dates come first. They are the opportunities domain's design and are not
          shown here.
        </Text>
        <section aria-labelledby="form-attachments" style={panel}>
          <Heading level={3} id="form-attachments">Attachments</Heading>
          <Text elementType="p">
            Attach any documents proponents need. Anyone who can read this opportunity can read its attachments. Removing an
            attachment stops it being readable through this opportunity once you save.
          </Text>
          <ul style={list} data-testid="attachment-list">
            <li style={item} data-testid="attachment-existing-row">
              <TextField
                label="Attachment name"
                value="Statement of work.pdf"
                isReadOnly
                description="Already stored, so its name cannot be changed."
                data-testid="attachment-existing-name"
              />
              <div style={row}>
                <Link
                  href="/api/files/5b2e0c3a-8d41-4f6e-a1c2-000000000803?type=blob"
                  data-testid="attachment-download-link"
                >
                  Download Statement of work.pdf
                </Link>
                <Button variant="secondary" size="small" aria-label="Remove Statement of work.pdf" data-testid="attachment-remove-button">
                  Remove
                </Button>
              </div>
            </li>
            <li style={item} data-testid="attachment-existing-row">
              <TextField
                label="Attachment name"
                value="Current permit screens.png"
                isReadOnly
                description="Already stored, so its name cannot be changed."
                data-testid="attachment-existing-name"
              />
              <div style={row}>
                <Link
                  href="/api/files/5b2e0c3a-8d41-4f6e-a1c2-000000000804?type=blob"
                  data-testid="attachment-download-link"
                >
                  Download Current permit screens.png
                </Link>
                <Button variant="secondary" size="small" aria-label="Remove Current permit screens.png" data-testid="attachment-remove-button">
                  Remove
                </Button>
              </div>
            </li>
          </ul>
          <div id="attachment-size-limit" data-testid="attachment-size-limit">
            <Text elementType="p" size="small" color="secondary">Any type of file, up to 10 MB each.</Text>
          </div>
          <div>
            <FileTrigger>
              <Button variant="secondary" aria-describedby="attachment-size-limit" data-testid="attachment-add-button">
                Add attachment
              </Button>
            </FileTrigger>
          </div>
        </section>
      </section>
    </div>
  ),
};
