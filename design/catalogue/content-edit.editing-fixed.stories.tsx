import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger, Toolbar } from "react-aria-components";
import { Button, ButtonGroup, Form, Heading, InlineAlert, Link, Text, TextArea, TextField } from "@bcgov/design-system-react-components";

// content-edit · editing-fixed — the administrator is editing "about", a page the service needs. The title and body can
// be changed; the address is shown but cannot be typed over, and the warning stays in view (R-7.25).
const meta: Meta = { title: "content/content-edit/editing-fixed" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const tools = { display: "flex", flexWrap: "wrap", gap: "var(--layout-margin-small)" } as const;

export const EditingFixed: StoryObj = {
  render: () => (
    <div style={page}>
      <div style={stack}>
        <Text elementType="p" size="small" color="secondary">Manage a page</Text>
        <Heading level={1}>about</Heading>
      </div>
      <div data-testid="content-fixed-page-warning">
        <InlineAlert variant="warning" title="The service needs this page">
          <Text elementType="p">
            Parts of the service link to this page or show its text, so it must stay at /content/about. You can change its
            title and body, but you cannot change its address or delete it.
          </Text>
        </InlineAlert>
      </div>
      <section aria-labelledby="content-edit-heading" style={stack}>
        <Heading level={2} id="content-edit-heading">Edit the page</Heading>
        <Text elementType="p">The title and body are required. Your changes are public as soon as you publish them.</Text>
        <Form validationBehavior="aria" style={stack}>
          <TextField
            id="content-title"
            label="Title"
            isRequired
            description="Between 1 and 100 characters."
            defaultValue="About the Digital Marketplace"
            data-testid="content-title-field"
          />
          <TextField
            id="content-slug"
            label="Address"
            isReadOnly
            description="The service needs this page at this address, so the address cannot be changed."
            defaultValue="about"
            data-testid="content-slug-field"
          />
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
              defaultValue="Initial version"
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
