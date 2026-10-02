import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// file-attach-by-identifier · refused — a second vendor saves their own proposal naming the identifier of a file another
// vendor uploaded and marked readable by no one else. They may not read that file, so they may not attach it: the
// attachment is refused and the proposal's attachments are as they were (R-8.22, which replaces R-8.15). What kind of
// refusal this is, and whether the rest of the save is kept, no criterion says (DESIGN.md, files, gap 14). Not a
// screen: the address answers with data. This response reference names the answer.
const meta: Meta = { title: "files/file-attach-by-identifier/refused" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { overflowWrap: "anywhere" } as const;

export const Refused: StoryObj = {
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
              <dd style={detail}>/api/proposals/code-with-us/3d9a51c7-2e6b-4f80-b1a4-000000000202</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Sent by</dt>
              <dd style={detail}>A vendor who wrote this proposal but did not upload the file and is given no way to read it</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>The record</dt>
              <dd style={detail}>The proposal as it stands, with one attachment added</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Attachment added</dt>
              <dd style={detail}>5b2e0c3a-8d41-4f6e-a1c2-000000000802</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="attach-answer">
          <Heading level={2} id="attach-answer">Answer</Heading>
          <Stack as="dl" gap="medium" data-testid="file-attach-refused">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd style={detail}>Refused: the file is not one the sender may read</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Message</dt>
              <dd style={detail}>You can only attach a file you are permitted to read.</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Attachments as stored</dt>
              <dd style={detail} data-testid="file-attach-identifiers">None. The proposal's attachments are as they were.</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Who may read the file</dt>
              <dd style={detail}>Unchanged. The proposal gives no one a way to read it.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
