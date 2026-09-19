import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import { Button, Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";

// file-attachment-control · too-large — the person chose a file larger than the limit that was stated before they
// chose it. The attachment is marked on its own row with a message naming the limit, and the form cannot be saved until
// it is removed. The service's own refusal of an oversized upload is shown in the same place with the same words
// (R-8.17).
const meta: Meta = { title: "files/file-attachment-control/too-large" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
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

export const TooLarge: StoryObj = {
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
            <li style={item} data-testid="attachment-new-row">
              <Text elementType="p">New: site-survey.pdf, 12.4 MB.</Text>
              <div data-testid="attachment-size-error">
                <InlineAlert variant="danger" role="alert" title="site-survey.pdf is too large to attach">
                  <Text elementType="p">
                    It is 12.4 MB. Attachments must be 10 MB or smaller. Remove it, then attach a smaller file.
                  </Text>
                </InlineAlert>
              </div>
              <div>
                <Button variant="secondary" size="small" aria-label="Remove site-survey.pdf" data-testid="attachment-remove-button">
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
