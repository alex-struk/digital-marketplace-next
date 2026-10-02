import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import { Button, Heading, Link, Text, TextField } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// file-attachment-control · new-attachment — the person chose "scan0001.pdf" and typed "Statement of work" as its name.
// A new attachment can be renamed or removed until it is saved; the line under the name shows that the ending of the
// original file is put back on, so it will be stored as "Statement of work.pdf" (R-8.27). The file is uploaded when the
// form is saved, with no read access recorded against it (R-8.19).
const meta: Meta = { title: "files/file-attachment-control/new-attachment" };
export default meta;

// The card section and an attachment row: a border and the inner padding that keeps content off it. Spacing inside
// each is the stack's.
const card = {
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const attachmentRow = {
  padding: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const base = "/opportunities/code-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000101/edit";

export const NewAttachment: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Manage a Code With Us opportunity</Text>
          <Heading level={1}>Build an accessible permit tracker</Heading>
        </Stack>
        <nav aria-label="Opportunity sections">
          <Stack as="ul" direction="row" gap="medium">
            <li><Link href={`${base}?tab=summary`}>Summary</Link></li>
            <li><Link href={`${base}?tab=opportunity`} aria-current="page">Opportunity</Link></li>
            <li><Link href={`${base}?tab=addenda`}>Addenda</Link></li>
            <li><Link href={`${base}?tab=history`}>History</Link></li>
          </Stack>
        </nav>
        <Stack as="section" gap="medium" aria-labelledby="tab-heading">
          <Heading level={2} id="tab-heading">Opportunity</Heading>
          <Text elementType="p" size="small" color="secondary">
            The overview, description, details and key dates come first. They are the opportunities domain's design and are
            not shown here.
          </Text>
          <section aria-labelledby="form-attachments" style={card}>
            <Stack gap="medium">
              <Heading level={3} id="form-attachments">Attachments</Heading>
              <Text elementType="p">
                Attach any documents proponents need. Anyone who can read this opportunity can read its attachments. Removing
                an attachment stops it being readable through this opportunity once you save.
              </Text>
              <Stack as="ul" gap="medium" data-testid="attachment-list">
                <li style={attachmentRow} data-testid="attachment-existing-row">
                  <Stack gap="small">
                    <TextField
                      label="Attachment name"
                      value="Current permit screens.png"
                      isReadOnly
                      description="Already stored, so its name cannot be changed."
                      data-testid="attachment-existing-name"
                    />
                    <Stack direction="row" align="center" gap="medium">
                      <Link
                        href="/api/files/5b2e0c3a-8d41-4f6e-a1c2-000000000804?type=blob"
                        data-testid="attachment-download-link"
                      >
                        Download Current permit screens.png
                      </Link>
                      <Button variant="secondary" size="small" aria-label="Remove Current permit screens.png" data-testid="attachment-remove-button">
                        Remove
                      </Button>
                    </Stack>
                  </Stack>
                </li>
                <li style={attachmentRow} data-testid="attachment-new-row">
                  <Stack gap="small">
                    <Text elementType="p">New: scan0001.pdf, 1.2 MB. It is uploaded when you save.</Text>
                    <TextField
                      label="Name for scan0001.pdf (optional)"
                      defaultValue="Statement of work"
                      description="Leave it empty to keep the name scan0001.pdf. If you leave off the ending, .pdf is added."
                      aria-describedby="attachment-new-1-result"
                      data-testid="attachment-name-field"
                    />
                    <div id="attachment-new-1-result" data-testid="attachment-resulting-name">
                      <Text elementType="p" size="small" color="secondary">Will be saved as: Statement of work.pdf</Text>
                    </div>
                    <div>
                      <Button variant="secondary" size="small" aria-label="Remove scan0001.pdf" data-testid="attachment-remove-button">
                        Remove
                      </Button>
                    </div>
                  </Stack>
                </li>
              </Stack>
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
            </Stack>
          </section>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
