import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// file-embedded-image · published — the page from file-embedded-image · inserted after publishing, as a reader sees it
// at /content/hackathon-rules. The renderer turned the marker into the image's download address, so the reader sees
// the image, with the description the administrator gave it (R-8.29). The page around the body is the content domain's
// (content-view · default) and is trimmed here.
const meta: Meta = { title: "files/file-embedded-image/published" };
export default meta;

// Keeps an image inside the text column, at its own size rather than stretched across the stack. Not spacing: see
// DESIGN.md, files, gap 11.
const image = { maxWidth: "100%", height: "auto", alignSelf: "flex-start" } as const;

export const Published: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack as="article" gap="large" aria-labelledby="content-page-title">
        <Heading level={1} id="content-page-title">Hackathon rules</Heading>
        <Text elementType="p" size="small" color="secondary">
          The published and last-updated dates are the content domain's design and are not shown here.
        </Text>
        <Stack gap="medium">
          <Text elementType="p">Placeholder: the rules of the hackathon, written by an administrator.</Text>
          <Heading level={2}>Where it happens</Heading>
          <img
            src="/api/files/5b2e0c3a-8d41-4f6e-a1c2-000000000806?type=blob"
            alt="Map of the harbour venue, with the main hall beside the ferry terminal"
            style={image}
            data-testid="content-body-image"
          />
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
