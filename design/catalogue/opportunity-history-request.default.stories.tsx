import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// opportunity-history-request · default — the opportunity's author or an administrator adds a private note, with a
// file, by request; the service accepts it, and reading the opportunity back carries the history with the note (R-1.33).
// Not a screen: the address answers with data. This response reference names the parts of the request and the answer.
const meta: Meta = { title: "opportunities/opportunity-history-request/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
          <Heading level={1}>An opportunity’s history, by request</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="opportunity-history-request">
          <Heading level={2} id="opportunity-history-request">Request</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Add a note</dt>
              <dd data-testid="opportunity-history-request-add-note">
                An update to /api/opportunities/code-with-us/:opportunityId asking to add a note of up to 1,000
                characters, with the identifiers of stored files to attach
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd>The opportunity’s author or an administrator</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="opportunity-history-answer">
          <Heading level={2} id="opportunity-history-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd data-testid="opportunity-history-request-accepted">Accepted: the opportunity is returned</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>History included</dt>
              <dd data-testid="opportunity-history-request-history-shown">Yes</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>History, newest first</dt>
              <dd>
                <Stack as="ol" gap="small" data-testid="opportunity-history-request-entries">
                  <li>
                    NOTE_ADDED · “Confirmed the budget with the finance office.” · Test Public Servant · September 21,
                    2026, 10:00 a.m. · budget-approval.pdf (illustrative record)
                  </li>
                  <li>Published · Test Administrator · September 10, 2026, 11:05 a.m.</li>
                  <li>Draft · Test Public Servant · September 8, 2026, 3:30 p.m.</li>
                </Stack>
              </dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
