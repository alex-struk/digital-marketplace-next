import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger, Toolbar } from "react-aria-components";
import { Button, ButtonGroup, Form, Heading, Link, Text, TextArea, TextField } from "@bcgov/design-system-react-components";

// content-create · ready — every field is filled in and valid, the full public address is shown, and Publish page is
// available (R-7.7, R-7.21)
const meta: Meta = { title: "content/content-create/ready" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const tools = { display: "flex", flexWrap: "wrap", gap: "var(--layout-margin-small)" } as const;

export const Ready: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Create a New Page</Heading>
      <Text elementType="p">
        Every field is required. A page can be read by anyone, including people who are not signed in, as soon as it is
        published.
      </Text>
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
        <Text elementType="p" id="content-publish-hint">You will be asked to confirm before the page is published.</Text>
        <ButtonGroup ariaLabel="Page actions">
          <Button variant="secondary" data-testid="content-cancel-button">Cancel</Button>
          <Button type="submit" variant="primary" aria-describedby="content-publish-hint" data-testid="content-publish-button">
            Publish page
          </Button>
        </ButtonGroup>
      </Form>
    </div>
  ),
};
