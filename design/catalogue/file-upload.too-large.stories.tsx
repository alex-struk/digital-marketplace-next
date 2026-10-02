import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// file-upload · too-large — a signed-in person submits a file larger than the service's limit; it is refused as the
// requester's error, with a message naming the limit, and nothing is stored (R-8.17, R-8.18). Not a screen: the
// address answers with data. This response reference names the answer.
const meta: Meta = { title: "files/file-upload/too-large" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const TooLarge: StoryObj = {
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
              <dd>site-survey.pdf, 12.4 MB</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Name to store it under</dt>
              <dd>site-survey.pdf</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Who may read it</dt>
              <dd>Anyone</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="upload-answer">
          <Heading level={2} id="upload-answer">Answer</Heading>
          <Stack as="dl" gap="medium" data-testid="file-upload-refused-size">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd>Refused: the file is too large (the requester's error)</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Message</dt>
              <dd>
                The file is larger than <span data-testid="file-upload-size-limit">10 MB</span>. Upload a file of 10 MB or
                smaller.
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
