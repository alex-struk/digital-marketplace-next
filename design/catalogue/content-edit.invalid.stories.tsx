import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger, Toolbar } from "react-aria-components";
import { Button, ButtonGroup, Form, Heading, InlineAlert, Link, Text, TextArea, TextField } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// content-edit · invalid — while editing, the title was cleared and the body grew past 50,000 characters. Each field is
// marked with its reason, the problems are listed before the unavailable Publish changes button, and nothing is saved
// (R-7.20). The body shown is a short stand-in for the overlong text.
const meta: Meta = { title: "content/content-edit/invalid" };
export default meta;

export const Invalid: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Manage a page</Text>
          <Heading level={1}>Hackathon rules</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="content-edit-heading">
          <Heading level={2} id="content-edit-heading">Edit the page</Heading>
          <Text elementType="p">Every field is required. Your changes are public as soon as you publish them.</Text>
          <Form validationBehavior="aria">
            <Stack gap="medium">
              <TextField
                id="content-title"
                label="Title"
                isRequired
                description="Between 1 and 100 characters."
                defaultValue=""
                isInvalid
                errorMessage="Enter a title"
                data-testid="content-title-field"
              />
              <Stack gap="small">
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
              </Stack>
              <Stack gap="small">
                <Toolbar aria-label="Formatting for Body">
                  <Stack direction="row" gap="small">
                    <Button variant="tertiary" size="small">Bold</Button>
                    <Button variant="tertiary" size="small">Italic</Button>
                    <Button variant="tertiary" size="small">Heading</Button>
                    <Button variant="tertiary" size="small">Bulleted list</Button>
                    <Button variant="tertiary" size="small">Numbered list</Button>
                    <Button variant="tertiary" size="small">Link</Button>
                    <FileTrigger acceptedFileTypes={["image/jpeg", "image/png"]}>
                      <Button variant="tertiary" size="small" data-testid="content-body-image-button">Insert image</Button>
                    </FileTrigger>
                  </Stack>
                </Toolbar>
                <TextArea
                  id="content-body"
                  label="Body"
                  isRequired
                  description="Formatted text, between 1 and 50,000 characters. An inserted image is placed at the cursor."
                  defaultValue="Placeholder: stands in for a body of 50,012 characters."
                  isInvalid
                  errorMessage="The body is 50,012 characters long. Shorten it to 50,000 characters or fewer."
                  data-testid="content-body-field"
                />
                <Text elementType="p" size="small">
                  <Link href="/content/markdown-guide" target="_blank">How to format text (opens in a new tab)</Link>
                </Text>
              </Stack>
              <div id="content-publish-hint">
                <InlineAlert variant="danger" title="Fix 2 fields to publish your changes">
                  <ul>
                    <li data-testid="field-error"><Link href="#content-title">Title: enter a title</Link></li>
                    <li data-testid="field-error"><Link href="#content-body">Body: shorten it to 50,000 characters or fewer</Link></li>
                  </ul>
                </InlineAlert>
              </div>
              <ButtonGroup ariaLabel="Edit actions">
                <Button variant="secondary" data-testid="content-cancel-button">Cancel</Button>
                <Button type="submit" variant="primary" isDisabled aria-describedby="content-publish-hint" data-testid="content-publish-changes-button">
                  Publish changes
                </Button>
              </ButtonGroup>
            </Stack>
          </Form>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
