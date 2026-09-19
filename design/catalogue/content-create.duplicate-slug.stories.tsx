import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger, Toolbar } from "react-aria-components";
import { Button, ButtonGroup, Form, Heading, InlineAlert, Link, Text, TextArea, TextField } from "@bcgov/design-system-react-components";

// content-create · duplicate-slug — the administrator confirmed publishing a page at "about", where a page already
// exists. The service refused it: nothing was created, the existing page is untouched, and the address is reported as
// already in use, both at the top of the form and at the field (R-7.22). Everything typed is kept.
const meta: Meta = { title: "content/content-create/duplicate-slug" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const tools = { display: "flex", flexWrap: "wrap", gap: "var(--layout-margin-small)" } as const;

export const DuplicateSlug: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Create a New Page</Heading>
      <div tabIndex={-1} data-testid="content-duplicate-slug-error">
        <InlineAlert variant="danger" role="alert" title="This address is already in use">
          <Text elementType="p">
            Another page is already published at /content/about, so this page was not created.{" "}
            <Link href="#content-slug">Choose a different address</Link>.
          </Text>
        </InlineAlert>
      </div>
      <Form validationBehavior="aria" style={stack}>
        <TextField
          id="content-title"
          label="Title"
          isRequired
          description="Between 1 and 100 characters."
          defaultValue="About the Digital Marketplace"
          data-testid="content-title-field"
        />
        <div style={stack}>
          <TextField
            id="content-slug"
            label="Address"
            isRequired
            defaultValue="about"
            isInvalid
            errorMessage="Another page already uses this address. Choose a different one."
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
            <Text elementType="p" size="small" color="secondary">Public address: https://digital-marketplace.example/content/about</Text>
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
            defaultValue="Placeholder: a second description of the service, written by an administrator."
            data-testid="content-body-field"
          />
          <Text elementType="p" size="small">
            <Link href="/content/markdown-guide" target="_blank">How to format text (opens in a new tab)</Link>
          </Text>
        </div>
        <ButtonGroup ariaLabel="Page actions">
          <Button variant="secondary" data-testid="content-cancel-button">Cancel</Button>
          <Button type="submit" variant="primary" data-testid="content-publish-button">Publish page</Button>
        </ButtonGroup>
      </Form>
    </div>
  ),
};
