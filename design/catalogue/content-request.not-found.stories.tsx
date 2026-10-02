import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// content-request · not-found — anybody asks for a page at a well-formed address that no page holds, and is answered
// that it was not found (R-7.2). Not a screen: the address answers with data. This response reference names the parts of
// the answer.
const meta: Meta = { title: "content/content-request/not-found" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const NotFound: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
          <Heading level={1}>Requests about a page</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="content-request-requests">
          <Heading level={2} id="content-request-requests">Request</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Read one page</dt>
              <dd data-testid="content-request-read-page">GET /api/content/nothing-here</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd>Anyone, signed in or not</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="content-request-answer">
          <Heading level={2} id="content-request-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd data-testid="content-request-refusal-status">Not found</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Page</dt>
              <dd>None. The answer carries no title, body or dates.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
