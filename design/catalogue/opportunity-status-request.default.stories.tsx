import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// opportunity-status-request · default — an administrator asks for a change on the program's permitted path (here a
// draft to published) and the service accepts it; the stored status is read afresh afterwards (R-1.20).
// Not a screen: the address answers with data. This response reference names the parts of the request and the answer.
const meta: Meta = { title: "opportunities/opportunity-status-request/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
          <Heading level={1}>An opportunity status change, by request</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="opportunity-status-request">
          <Heading level={2} id="opportunity-status-request">Request</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Change the status</dt>
              <dd data-testid="opportunity-status-request-change">
                An update to /api/opportunities/sprint-with-us/:opportunityId sending the operation that leads to
                PUBLISHED
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd>An administrator</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="opportunity-status-answer">
          <Heading level={2} id="opportunity-status-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd data-testid="opportunity-status-request-accepted">Accepted: the opportunity is returned</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Status, read afresh afterwards</dt>
              <dd data-testid="opportunity-status-request-stored-status">PUBLISHED</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
