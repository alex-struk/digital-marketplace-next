import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// affiliation-invitation-request · default — an organization's owner invites a registered vendor by email address,
// naming them as an ordinary member. The invitation is created as a pending membership, and the answer carries the new
// membership's identifier, which affiliation-approval-request takes (R-3.7, R-3.17).
// Not a screen: the address answers with data. This response reference names the parts of the request and the answer.
const meta: Meta = { title: "organizations/affiliation-invitation-request/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
          <Heading level={1}>Invite somebody to an organization</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="affiliation-invitation-request">
          <Heading level={2} id="affiliation-invitation-request">Request</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Invite, naming a membership type</dt>
              <dd data-testid="affiliation-invitation-request-invite">
                POST /api/affiliations, sending the organization, the invited person’s email address and a membership type
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Sent</dt>
              <dd>Organization: Northwind Digital Co-operative. Email address: vendor.four@example.com. Membership type: MEMBER</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd>The organization’s owner</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="affiliation-invitation-answer">
          <Heading level={2} id="affiliation-invitation-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd data-testid="affiliation-invitation-request-created">Created: the invitation is a pending membership</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Membership identifier</dt>
              <dd data-testid="affiliation-invitation-request-membership-id">7c41e2d0-93a5-4b8e-a1f6-000000000301</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>What changed</dt>
              <dd>
                The invited person has a pending invitation. They do not count towards the team’s size or capabilities until
                they accept it themselves.
              </dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
