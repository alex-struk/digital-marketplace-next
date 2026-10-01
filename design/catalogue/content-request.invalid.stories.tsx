import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// content-request · invalid — an administrator sends something the service will not take: a title or body of the wrong
// length (R-7.20), an address that is not lowercase letters and digits in hyphen-separated groups (R-7.21), an address
// another page holds (R-7.22), a rename or removal of a page the service needs (R-7.25), or a read at an address that is
// not well formed (R-7.3). Nothing changes. Not a screen: the address answers with data. This response reference names
// the parts of the answer.
const meta: Meta = { title: "content/content-request/invalid" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Invalid: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
          <Heading level={1}>Requests about a page</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="content-request-requests">
          <Heading level={2} id="content-request-requests">Requests</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Read one page</dt>
              <dd data-testid="content-request-read-page">GET /api/content/Not_A_Slug</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Create a page</dt>
              <dd data-testid="content-request-create">POST /api/content, sending an empty title</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Change a page</dt>
              <dd data-testid="content-request-change">PUT /api/content/hackathon-rules, sending a body over 50,000 characters</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Rename a page</dt>
              <dd data-testid="content-request-rename">PUT /api/content/about, sending a new address for a page the service needs</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Remove a page</dt>
              <dd data-testid="content-request-remove">DELETE /api/content/about, a page the service needs</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd>An administrator</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="content-request-answer">
          <Heading level={2} id="content-request-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd data-testid="content-request-refusal-status">Refused: invalid request</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Form of the answer</dt>
              <dd data-testid="content-request-refusal-shape">
                A refusal of what was sent, naming the failing field (title, address or body) or the address asked for
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>What changed</dt>
              <dd>Nothing. No page is created, changed, renamed or removed.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
