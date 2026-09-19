import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger, Toolbar } from "react-aria-components";
import { Button, ButtonGroup, Form, Heading, InlineAlert, Link, Text, TextArea, TextField } from "@bcgov/design-system-react-components";

// content-edit · duplicate-slug — the administrator tried to move "about-us" to "about", where another page is published.
// The service refused: nothing changed on either page, and the address is reported as already in use at the top of the
// section and at the field (R-7.22). Everything typed is kept.
const meta: Meta = { title: "content/content-edit/duplicate-slug" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const tools = { display: "flex", flexWrap: "wrap", gap: "var(--layout-margin-small)" } as const;

export const DuplicateSlug: StoryObj = {
  render: () => (
    <div style={page}>
      <div style={stack}>
        <Text elementType="p" size="small" color="secondary">Manage a page</Text>
        <Heading level={1}>About us</Heading>
      </div>
      <section aria-labelledby="content-edit-heading" style={stack}>
        <Heading level={2} id="content-edit-heading">Edit the page</Heading>
        <div tabIndex={-1} data-testid="content-duplicate-slug-error">
          <InlineAlert variant="danger" role="alert" title="This address is already in use">
            <Text elementType="p">
              Another page is already published at /content/about, so your changes were not published.{" "}
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
            defaultValue="About us"
            data-testid="content-title-field"
          />
          <div style={stack}>
            <TextField
              id="content-slug"
              label="Address"
              isRequired
              description="Changing the address moves the page at once. Links to the old address will stop working."
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
              defaultValue="Placeholder: a description of the service, written by an administrator."
              data-testid="content-body-field"
            />
            <Text elementType="p" size="small">
              <Link href="/content/markdown-guide" target="_blank">How to format text (opens in a new tab)</Link>
            </Text>
          </div>
          <ButtonGroup ariaLabel="Edit actions">
            <Button variant="secondary" data-testid="content-cancel-button">Cancel</Button>
            <Button type="submit" variant="primary" data-testid="content-publish-changes-button">Publish changes</Button>
          </ButtonGroup>
        </Form>
      </section>
    </div>
  ),
};
