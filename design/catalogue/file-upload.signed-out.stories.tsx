import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// file-upload · signed-out — a visitor who is not signed in submits a file; the upload is refused as not permitted and
// nothing is stored (R-8.1). Not a screen: the address answers with data. This response reference names the answer.
const meta: Meta = { title: "files/file-upload/signed-out" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const SignedOut: StoryObj = {
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
              <dd>/api/files, sent by a visitor who is not signed in</dd>
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
              <dd>Anyone</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="upload-answer">
          <Heading level={2} id="upload-answer">Answer</Heading>
          <Stack as="dl" gap="medium" data-testid="file-upload-refused-signed-out">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd>Refused: not permitted</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Message</dt>
              <dd>Sign in to upload a file.</dd>
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
