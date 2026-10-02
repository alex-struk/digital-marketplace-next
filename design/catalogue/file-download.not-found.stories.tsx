import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// file-download · not-found — an administrator asks for the content of an identifier no stored file carries and is
// told it was not found; anyone else is answered as in file-download · refused (R-8.12). Not a screen: the address
// answers with data. This response reference names the answer.
const meta: Meta = { title: "files/file-download/not-found" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { overflowWrap: "anywhere" } as const;

export const NotFound: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with the file, not a page</Text>
          <Heading level={1}>A stored file</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="download-request">
          <Heading level={2} id="download-request">Request</Heading>
          <Stack as="dl" gap="medium" data-testid="file-download-request">
            <Stack gap="small">
              <dt style={term}>Address</dt>
              <dd style={detail}>/api/files/00000000-0000-4000-8000-000000000000?type=blob</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd style={detail}>An administrator</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="download-answer">
          <Heading level={2} id="download-answer">Answer</Heading>
          <Stack as="dl" gap="medium" data-testid="file-not-found">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd style={detail}>Not found</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Message</dt>
              <dd style={detail}>No stored file has this identifier.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
