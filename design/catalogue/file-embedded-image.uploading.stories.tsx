import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger, Toolbar } from "react-aria-components";
import { Button, Heading, Link, ProgressCircle, Text, TextArea } from "@bcgov/design-system-react-components";

// file-embedded-image · uploading — the administrator chose "harbour-map.png" and it is being stored. A status line
// says so; Insert image is unavailable until the upload ends, and the body is not changed until it succeeds (R-8.29).
// The rest of the editor stays usable.
const meta: Meta = { title: "files/file-embedded-image/uploading" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const tools = { display: "flex", flexWrap: "wrap", gap: "var(--layout-margin-small)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--layout-margin-small)" } as const;
const body = "Placeholder: the rules of the hackathon, written by an administrator.\n\n## Where it happens";

export const Uploading: StoryObj = {
  render: () => (
    <div style={page}>
      <div style={stack}>
        <Text elementType="p" size="small" color="secondary">Manage a page</Text>
        <Heading level={1}>Hackathon rules</Heading>
      </div>
      <section aria-labelledby="content-edit-heading" style={stack}>
        <Heading level={2} id="content-edit-heading">Edit the page</Heading>
        <Text elementType="p" size="small" color="secondary">
          The title and address come first. They are the content domain's design and are not shown here.
        </Text>
        <div style={stack}>
          <Toolbar aria-label="Formatting for Body" style={tools}>
            <Button variant="tertiary" size="small">Bold</Button>
            <Button variant="tertiary" size="small">Italic</Button>
            <Button variant="tertiary" size="small">Heading</Button>
            <Button variant="tertiary" size="small">Bulleted list</Button>
            <Button variant="tertiary" size="small">Numbered list</Button>
            <Button variant="tertiary" size="small">Link</Button>
            <FileTrigger acceptedFileTypes={["image/jpeg", "image/png"]}>
              <Button
                variant="tertiary"
                size="small"
                isDisabled
                aria-describedby="embedded-image-rule"
                data-testid="content-body-image-button"
              >
                Insert image
              </Button>
            </FileTrigger>
          </Toolbar>
          <div id="embedded-image-rule" data-testid="image-file-rule">
            <Text elementType="p" size="small" color="secondary">
              Insert image takes a JPEG or PNG image, up to 10 MB. An inserted image is stored as soon as you choose it and
              anyone can see it.
            </Text>
          </div>
          <div style={row} role="status" data-testid="embedded-image-uploading">
            <ProgressCircle isIndeterminate aria-label="Uploading image" />
            <Text>Uploading harbour-map.png…</Text>
          </div>
          <TextArea
            id="content-body"
            label="Body"
            isRequired
            description="Formatted text, between 1 and 50,000 characters. An inserted image is placed at the cursor."
            defaultValue={body}
            data-testid="content-body-field"
          />
          <Text elementType="p" size="small">
            <Link href="/content/markdown-guide" target="_blank">How to format text (opens in a new tab)</Link>
          </Text>
        </div>
      </section>
    </div>
  ),
};
