import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// file-download · refused — a second vendor asks for the content of a file another vendor uploaded and marked readable
// by no one else, or for an identifier no file carries; both are answered as not authorized and no content is sent
// (R-8.7, R-8.12, R-8.25). Not a screen: the address answers with data. This response reference names the answer.
const meta: Meta = { title: "files/file-download/refused" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { overflowWrap: "anywhere" } as const;

export const Refused: StoryObj = {
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
              <dd style={detail}>/api/files/5b2e0c3a-8d41-4f6e-a1c2-000000000802?type=blob</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd style={detail}>A vendor who did not upload the file and is given no way to read it</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="download-answer">
          <Heading level={2} id="download-answer">Answer</Heading>
          <Stack as="dl" gap="medium" data-testid="file-refused">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd style={detail}>Refused: not authorized</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Message</dt>
              <dd style={detail}>You are not authorized to read this file.</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Same answer when</dt>
              <dd style={detail}>No stored file has the identifier asked for, or the identifier is malformed</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
