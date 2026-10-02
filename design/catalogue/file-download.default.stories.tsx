import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// file-download · default — a visitor who is not signed in asks for the content of a file marked readable by anyone and
// receives its bytes, described by a content type worked out from the name alone and offered as a download named for
// saving rather than displayed (R-8.7, R-8.10). Every download link in the interface is this request. Not a screen:
// the address answers with the file. This response reference names each part of the answer.
const meta: Meta = { title: "files/file-download/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { overflowWrap: "anywhere" } as const;

export const Default: StoryObj = {
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
              <dd style={detail}>/api/files/5b2e0c3a-8d41-4f6e-a1c2-000000000801?type=blob</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd style={detail}>A visitor who is not signed in. The file was marked readable by anyone.</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="download-answer">
          <Heading level={2} id="download-answer">Answer</Heading>
          <Stack as="dl" gap="medium" data-testid="file-download-response">
            <Stack gap="small">
              <dt style={term}>Content</dt>
              <dd style={detail} data-testid="file-download-body">The stored bytes of terms.pdf, 240 KB</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Described as</dt>
              <dd style={detail} data-testid="file-download-content-type">
                application/pdf, worked out from the ending of the name. A name with no recognised ending is described as
                unspecified binary data.
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Offered as</dt>
              <dd style={detail} data-testid="file-download-disposition">A file to save, not to display in the browser</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Named for saving</dt>
              <dd style={detail} data-testid="file-download-filename">terms.pdf</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
