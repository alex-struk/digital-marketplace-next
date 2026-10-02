import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger, Toolbar } from "react-aria-components";
import { Button, Heading, Link, Text, TextArea } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// file-embedded-image · inserted — "harbour-map.png" was stored and a reference to it was inserted at the cursor. The
// reference is an internal marker carrying the file's identifier, never a web address; it is turned into the file's
// address only when the text is displayed (R-8.29). The inserted reference carries placeholder alternative text, which
// is selected so the administrator can type a description over it.
const meta: Meta = { title: "files/file-embedded-image/inserted" };
export default meta;

const body =
  "Placeholder: the rules of the hackathon, written by an administrator.\n\n## Where it happens\n\n" +
  "![Describe this image](@file/5b2e0c3a-8d41-4f6e-a1c2-000000000806)";

export const Inserted: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Manage a page</Text>
          <Heading level={1}>Hackathon rules</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="content-edit-heading">
          <Heading level={2} id="content-edit-heading">Edit the page</Heading>
          <Text elementType="p" size="small" color="secondary">
            The title and address come first. They are the content domain's design and are not shown here.
          </Text>
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
                  <Button variant="tertiary" size="small" aria-describedby="embedded-image-rule" data-testid="content-body-image-button">
                    Insert image
                  </Button>
                </FileTrigger>
              </Stack>
            </Toolbar>
            <div id="embedded-image-rule" data-testid="image-file-rule">
              <Text elementType="p" size="small" color="secondary">
                Insert image takes a JPEG or PNG image, up to 10 MB. An inserted image is stored as soon as you choose it and
                anyone can see it.
              </Text>
            </div>
            <div role="status">
              <Text elementType="p">
                harbour-map.png was inserted at the cursor. Replace "Describe this image" with a description of what it shows.
              </Text>
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
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
