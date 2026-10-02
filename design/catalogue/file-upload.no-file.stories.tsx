import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// file-upload · no-file — the submission carries a name and a read-access statement but no file part; it is refused as
// a bad request naming what was missing, and is not recorded as a fault of the service (R-8.18). Not a screen: the
// address answers with data. This response reference names the answer.
const meta: Meta = { title: "files/file-upload/no-file" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const NoFile: StoryObj = {
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
              <dd>None</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Name to store it under</dt>
              <dd>terms.pdf</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Who may read it</dt>
              <dd>Anyone</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="upload-answer">
          <Heading level={2} id="upload-answer">Answer</Heading>
          <Stack as="dl" gap="medium" data-testid="file-upload-refused-no-file">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd>Refused: bad request</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Message</dt>
              <dd>The submission carried no file. Include the file to upload.</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Stored</dt>
              <dd>Nothing. Not recorded in the service's error log.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
