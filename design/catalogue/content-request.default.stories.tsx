import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// content-request · default — an administrator asks the service to read the list of pages, read one page, create a page,
// change one, rename one and remove one, and each request is answered (R-7.5, R-7.1, R-7.7, R-7.8, R-7.24, R-7.9). Not a
// screen: the address answers with data. This response reference names the requests and the part of the answer the
// surface observes. Methods and addresses are the service's published interface description's.
const meta: Meta = { title: "content/content-request/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Default: StoryObj = {
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
              <dt style={term}>Read the list of pages</dt>
              <dd data-testid="content-request-read-list">GET /api/content</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Read one page</dt>
              <dd data-testid="content-request-read-page">GET /api/content/hackathon-rules</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Create a page</dt>
              <dd data-testid="content-request-create">POST /api/content, sending a title, an address and a body</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Change a page</dt>
              <dd data-testid="content-request-change">PUT /api/content/hackathon-rules, sending the new title and body with the same address</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Rename a page</dt>
              <dd data-testid="content-request-rename">PUT /api/content/hackathon-rules, sending a new address</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Remove a page</dt>
              <dd data-testid="content-request-remove">DELETE /api/content/hackathon-rules</dd>
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
              <dd data-testid="content-request-accepted">Answered</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>What comes back</dt>
              <dd>
                The list of every page; the page asked for, with its body and its published and updated dates; or the page as
                created, changed, renamed or removed
              </dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
