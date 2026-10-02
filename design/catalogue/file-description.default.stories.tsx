import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// file-description · default — a person who may read a stored file asks for it without requesting its content, and
// receives its identifier, name, stored date and the identifier of the stored content it shares with any identical
// upload, but not the content itself (R-8.5, R-8.11). Not a screen: the address answers with data. This response
// reference names each part of the answer.
const meta: Meta = { title: "files/file-description/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { overflowWrap: "anywhere" } as const;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
          <Heading level={1}>A stored file's description</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="description-request">
          <Heading level={2} id="description-request">Request</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Address</dt>
              <dd style={detail}>/api/files/5b2e0c3a-8d41-4f6e-a1c2-000000000801, without requesting the content</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd style={detail}>A person who may read the file</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="description-answer">
          <Heading level={2} id="description-answer">Answer</Heading>
          <Stack as="dl" gap="medium" data-testid="file-description-answer">
            <Stack gap="small">
              <dt style={term}>Identifier</dt>
              <dd style={detail} data-testid="file-description-id">5b2e0c3a-8d41-4f6e-a1c2-000000000801</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Name</dt>
              <dd style={detail} data-testid="file-description-name">terms.pdf</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Stored</dt>
              <dd style={detail} data-testid="file-description-stored-date">
                <time dateTime="2026-09-19T10:15:00-07:00">September 19, 2026 at 10:15 a.m.</time>
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Stored content</dt>
              <dd style={detail} data-testid="file-description-content-id">
                9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Content</dt>
              <dd style={detail}>Not included</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
