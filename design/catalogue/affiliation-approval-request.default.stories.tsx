import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// affiliation-approval-request · default — the invited person accepts their own pending invitation by request. The
// membership becomes active (R-3.9).
// Not a screen: the address answers with data. This response reference names the parts of the request and the answer.
const meta: Meta = { title: "organizations/affiliation-approval-request/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
          <Heading level={1}>Accept a membership, by request</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="affiliation-approval-request">
          <Heading level={2} id="affiliation-approval-request">Request</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Accept a membership</dt>
              <dd data-testid="affiliation-approval-request-accept">
                PUT /api/affiliations/7c41e2d0-93a5-4b8e-a1f6-000000000301, sending the approve action
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd>The invited person, while the invitation is pending</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="affiliation-approval-answer">
          <Heading level={2} id="affiliation-approval-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd data-testid="affiliation-approval-request-accepted">Accepted</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Membership status</dt>
              <dd data-testid="affiliation-approval-request-membership-status">ACTIVE</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>What changed</dt>
              <dd>The person is an active member and now counts towards the team’s size and capabilities.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
