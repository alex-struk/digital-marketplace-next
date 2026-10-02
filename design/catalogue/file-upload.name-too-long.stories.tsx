import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// file-upload · name-too-long — the name to store the file under is 256 characters; the upload is refused as a bad
// request and the message names the permitted length (R-8.23). Not a screen: the address answers with data. This
// response reference names the answer.
const meta: Meta = { title: "files/file-upload/name-too-long" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const NameTooLong: StoryObj = {
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
              <dd>A name 256 characters long</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Who may read it</dt>
              <dd>Anyone</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="upload-answer">
          <Heading level={2} id="upload-answer">Answer</Heading>
          <Stack as="dl" gap="medium" data-testid="file-upload-refused-name">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd>Refused: bad request</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Message</dt>
              <dd>The file name must be between 1 and 255 characters long.</dd>
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
