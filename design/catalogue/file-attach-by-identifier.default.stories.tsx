import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// file-attach-by-identifier · default — a vendor who may read a stored file (they uploaded it) saves their Code With Us
// proposal as it stands, naming that file's identifier as an attachment. The attachment is accepted (R-8.22), and the
// file becomes readable by whoever may read the proposal (R-8.20). Not a screen: the address answers with data. This
// response reference names each part of the answer.
const meta: Meta = { title: "files/file-attach-by-identifier/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { overflowWrap: "anywhere" } as const;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
          <Heading level={1}>Attach a stored file by its identifier</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="attach-request">
          <Heading level={2} id="attach-request">Request</Heading>
          <Stack as="dl" gap="medium" data-testid="file-attach-request">
            <Stack gap="small">
              <dt style={term}>Address</dt>
              <dd style={detail}>/api/proposals/code-with-us/3d9a51c7-2e6b-4f80-b1a4-000000000201</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Sent by</dt>
              <dd style={detail}>The vendor who wrote the proposal, and who uploaded the file and may read it</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>The record</dt>
              <dd style={detail}>The proposal as it stands, with one attachment added</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Attachment added</dt>
              <dd style={detail}>5b2e0c3a-8d41-4f6e-a1c2-000000000807</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="attach-answer">
          <Heading level={2} id="attach-answer">Answer</Heading>
          <Stack as="dl" gap="medium" data-testid="file-attach-accepted">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd style={detail}>Saved, with the file attached</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Attachments as stored</dt>
              <dd style={detail} data-testid="file-attach-identifiers">
                5b2e0c3a-8d41-4f6e-a1c2-000000000803, 5b2e0c3a-8d41-4f6e-a1c2-000000000807
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Who may now read the file</dt>
              <dd style={detail}>Whoever may read the proposal, as well as anyone who could read it before</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
