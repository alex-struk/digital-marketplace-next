import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// opportunity-status-request · refused — an administrator asks to move an awarded opportunity back to published, a
// change off the permitted path; the service refuses it and the stored status is unchanged (R-1.20). The refusal's
// status and words are not stated in the criteria (see DESIGN.md, opportunities gap 28).
// Not a screen: the address answers with data. This response reference names the parts of the request and the answer.
const meta: Meta = { title: "opportunities/opportunity-status-request/refused" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Refused: StoryObj = {
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
                An update to /api/opportunities/code-with-us/:opportunityId sending the operation that leads to
                PUBLISHED, for an opportunity already awarded
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
              <dd data-testid="opportunity-status-request-refusal-status">Refused (the criteria do not state the status)</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Messages, in the order given</dt>
              <dd>
                <Stack as="ol" gap="small" data-testid="opportunity-status-request-refusal-messages">
                  <li>The service’s general permission message (its words are not stated)</li>
                </Stack>
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Status, read afresh afterwards</dt>
              <dd data-testid="opportunity-status-request-stored-status">AWARDED</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
