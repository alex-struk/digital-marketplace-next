import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger, Toolbar } from "react-aria-components";
import { Button, ButtonGroup, Form, Heading, Link, Text, TextArea, TextField } from "@bcgov/design-system-react-components";

// content-edit · editing — the administrator pressed Edit page on an ordinary page. Title, address and body can all be
// changed (R-7.8); the address field says that a new address moves the page at once and leaves nothing at the old one
// (R-7.24). Only the current wording is offered for editing, with no earlier version to go back to (R-7.23).
const meta: Meta = { title: "content/content-edit/editing" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const tools = { display: "flex", flexWrap: "wrap", gap: "var(--layout-margin-small)" } as const;

export const Editing: StoryObj = {
  render: () => (
    <div style={page}>
      <div style={stack}>
        <Text elementType="p" size="small" color="secondary">Manage a page</Text>
        <Heading level={1}>Hackathon rules</Heading>
      </div>
      <section aria-labelledby="content-edit-heading" style={stack}>
        <Heading level={2} id="content-edit-heading">Edit the page</Heading>
        <Text elementType="p">Every field is required. Your changes are public as soon as you publish them.</Text>
        <Form validationBehavior="aria" style={stack}>
          <TextField
            id="content-title"
            label="Title"
            isRequired
            description="Between 1 and 100 characters."
            defaultValue="Hackathon rules"
            data-testid="content-title-field"
          />
          <div style={stack}>
            <TextField
              id="content-slug"
              label="Address"
              isRequired
              description="Changing the address moves the page at once. Links to the old address will stop working."
              defaultValue="hackathon-rules"
              aria-describedby="content-slug-rule content-resulting-address"
              data-testid="content-slug-field"
            />
            <div id="content-slug-rule" data-testid="content-slug-rule">
              <Text elementType="p" size="small" color="secondary">
                Use lowercase letters and numbers, in groups joined by single hyphens, like about-us. No capital letters,
                spaces or underscores, and no hyphen at the start or end.
              </Text>
            </div>
            <div id="content-resulting-address" data-testid="content-resulting-address">
              <Text elementType="p" size="small" color="secondary">
                Public address: https://digital-marketplace.example/content/hackathon-rules
              </Text>
            </div>
          </div>
          <div style={stack}>
            <Toolbar aria-label="Formatting for Body" style={tools}>
              <Button variant="tertiary" size="small">Bold</Button>
              <Button variant="tertiary" size="small">Italic</Button>
              <Button variant="tertiary" size="small">Heading</Button>
              <Button variant="tertiary" size="small">Bulleted list</Button>
              <Button variant="tertiary" size="small">Numbered list</Button>
              <Button variant="tertiary" size="small">Link</Button>
              <FileTrigger acceptedFileTypes={["image/jpeg", "image/png"]}>
                <Button variant="tertiary" size="small" data-testid="content-body-image-button">Insert image</Button>
              </FileTrigger>
            </Toolbar>
            <TextArea
              id="content-body"
              label="Body"
              isRequired
              description="Formatted text, between 1 and 50,000 characters. An inserted image is placed at the cursor."
              defaultValue="Placeholder: the rules of the hackathon, written by an administrator."
              data-testid="content-body-field"
            />
            <Text elementType="p" size="small">
              <Link href="/content/markdown-guide" target="_blank">How to format text (opens in a new tab)</Link>
            </Text>
          </div>
          <Text elementType="p" id="content-publish-hint">You will be asked to confirm before your changes are published.</Text>
          <ButtonGroup ariaLabel="Edit actions">
            <Button variant="secondary" data-testid="content-cancel-button">Cancel</Button>
            <Button type="submit" variant="primary" aria-describedby="content-publish-hint" data-testid="content-publish-changes-button">
              Publish changes
            </Button>
          </ButtonGroup>
        </Form>
      </section>
    </div>
  ),
};
