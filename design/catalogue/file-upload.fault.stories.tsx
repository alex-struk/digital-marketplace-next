import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// file-upload · fault — a well-formed upload that fails because of the service itself (here, illustratively, storage
// that cannot be written). This is the one answer that is a fault of the service; R-8.17, R-8.18 and R-8.24 say that a
// submission that is the requester's error must never get it. Not a screen: the address answers with data. This
// response reference names the answer.
const meta: Meta = { title: "files/file-upload/fault" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Fault: StoryObj = {
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
          <Stack as="dl" gap="medium" data-testid="file-upload-service-fault">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd>Failed: a fault of the service</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Message</dt>
              <dd>The file could not be stored because of a problem with the service. Try again later.</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Stored</dt>
              <dd>Nothing. The working copy has been removed, and the fault is recorded in the service's error log.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
