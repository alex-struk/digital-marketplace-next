import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// content-request · refused — a signed-in vendor, a signed-in public sector employee or a visitor who is not signed in
// asks to read the list of pages, or to create, change, rename or remove a page. Nothing changes (R-7.10), and every one
// of those refusals is a permission refusal in one and the same form, never dressed up as a faulty submission (R-7.16).
// Not a screen: the address answers with data. This response reference names the parts of the answer.
const meta: Meta = { title: "content/content-request/refused" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Refused: StoryObj = {
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
              <dd>Anyone but an administrator, signed in or not</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="content-request-answer">
          <Heading level={2} id="content-request-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd data-testid="content-request-refusal-status">Refused: not permitted</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Form of the answer</dt>
              <dd data-testid="content-request-refusal-shape">
                A permission refusal, the same for all five requests: the reason is named as a lack of permission, never as
                something wrong with what was sent
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>What changed</dt>
              <dd>Nothing. No page is created, changed, renamed or removed, and no page is listed.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
