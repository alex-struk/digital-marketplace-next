import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// file-upload · default — a signed-in person submits one file, a name and a read-access statement together, and the
// service answers with the stored file's record: its identifier, its name and the date it was stored (R-8.1, R-8.2,
// R-8.6). Not a screen: the address answers with data. This response reference names each part of the answer.
const meta: Meta = { title: "files/file-upload/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Default: StoryObj = {
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
              <dd>/api/files, sent by a signed-in person as one submission</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>The file</dt>
              <dd>terms.pdf, 240 KB, its size declared in advance</dd>
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
          <Stack as="dl" gap="medium" data-testid="file-upload-stored">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd>Stored</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Identifier</dt>
              <dd data-testid="file-upload-stored-id">5b2e0c3a-8d41-4f6e-a1c2-000000000801</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Name</dt>
              <dd>terms.pdf</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Stored</dt>
              <dd><time dateTime="2026-09-19T10:15:00-07:00">September 19, 2026 at 10:15 a.m.</time></dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
