import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import { Button, Heading, Link, Text, TextField } from "@bcgov/design-system-react-components";

// file-attachment-control · invalid — the person saved with a new attachment's name longer than 255 characters. The
// save is refused and the error is shown against that attachment, not against the form as a whole; what was typed is
// kept (R-8.23, R-8.27 note). Focus moves to the name field.
const meta: Meta = { title: "files/file-attachment-control/invalid" };
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
const longName =
  "Statement of work for the accessible permit tracker including the full description of every screen the applicant " +
  "sees, the status messages for each stage of an application, the plain-language glossary, the keyboard and screen " +
  "reader test plan, and the schedule";

export const Invalid: StoryObj = {
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
              <Text elementType="p">New: scan0001.pdf, 1.2 MB. It is uploaded when you save.</Text>
              <TextField
                label="Name for scan0001.pdf (optional)"
                defaultValue={longName}
                description="Leave it empty to keep the name scan0001.pdf. If you leave off the ending, .pdf is added."
                isInvalid
                errorMessage="The file name must be between 1 and 255 characters long. With its ending, this one is 264."
                data-testid="attachment-name-field"
              />
              <div>
                <Button variant="secondary" size="small" aria-label="Remove scan0001.pdf" data-testid="attachment-remove-button">
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
