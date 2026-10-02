import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// affiliation-invitation-request · invalid — an organization's owner invites somebody and names a membership type other
// than member or owner. The invitation is refused as an invalid membership type and nothing is created (R-3.17).
// Administrator rights are never granted by an invitation; they are given afterwards (R-3.12).
// Not a screen: the address answers with data. This response reference names the parts of the request and the answer.
const meta: Meta = { title: "organizations/affiliation-invitation-request/invalid" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Invalid: StoryObj = {
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
              <dd>Organization: Northwind Digital Co-operative. Email address: vendor.four@example.com. Membership type: ADMIN</dd>
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
              <dd data-testid="affiliation-invitation-request-invalid-membership-type">
                Refused: invalid membership type. Only a member or an owner may be named.
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>What changed</dt>
              <dd>Nothing. No invitation is created and no email is sent.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
