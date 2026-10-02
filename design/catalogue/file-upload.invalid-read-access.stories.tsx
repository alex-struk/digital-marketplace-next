import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// file-upload · invalid-read-access — the read-access statement names a kind of access the service does not recognise;
// the upload is refused as a bad request reporting that the information was invalid, and nothing is stored (R-8.24).
// A statement that is missing, or is not well-formed data at all, gets the same answer with its own message (R-8.18).
// Not a screen: the address answers with data. This response reference names the answer.
const meta: Meta = { title: "files/file-upload/invalid-read-access" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const InvalidReadAccess: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
          <Heading level={1}>Storing a file</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="upload-request">
          <Heading level={2} id="upload-request">Request</Heading>
          <Stack as="dl" gap="medium" data-testid="file-upload-request">
            <Stack gap="small">
              <dt style={term}>Address</dt>
              <dd>/api/files, sent by a signed-in person</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>The file</dt>
              <dd>terms.pdf, 240 KB</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Name to store it under</dt>
              <dd>terms.pdf</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Who may read it</dt>
              <dd>A kind of access named "ministry", which the service does not recognise</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="upload-answer">
          <Heading level={2} id="upload-answer">Answer</Heading>
          <Stack as="dl" gap="medium" data-testid="file-upload-refused-read-access">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd>Refused: bad request</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Message</dt>
              <dd>
                The read-access information provided was invalid: "ministry" is not a kind of access the service recognises.
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Stored</dt>
              <dd>Nothing. The working copy has been removed.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
