import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-team-request · default — a signed-in vendor makes and submits a Sprint With Us or Team With Us proposal in one
// request, its team given by account, and the service accepts it (R-2.17, R-2.18).
// Not a screen: the address answers with data. This response reference names the parts of the request and the answer.
const meta: Meta = { title: "proposals/proposal-team-request/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
          <Heading level={1}>A team proposal, by request</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="proposal-team-request-requests">
          <Heading level={2} id="proposal-team-request-requests">Request</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Submit a team proposal</dt>
              <dd data-testid="proposal-team-request-submit">
                Sent to /api/proposals/&lt;program&gt;, program being sprint-with-us or team-with-us. For Team With Us: the
                opportunity, the organization, the team as member, resource and hourly rate, and an answer to each resource
                question by order. For Sprint With Us: the opportunity, the organization, each phase given with its members,
                scrum master and proposed cost, an answer to each team question by order, and any references. Sent as a
                submission rather than a draft.
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd>The signed-in vendor, for an organization they may submit for</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="proposal-team-request-answer">
          <Heading level={2} id="proposal-team-request-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Proposal accepted</dt>
              <dd data-testid="proposal-team-request-accepted">Yes: the service answers with the new proposal</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Proposal</dt>
              <dd data-testid="proposal-team-request-proposal-id">The new proposal's identifier, for its edit and view pages</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Status</dt>
              <dd data-testid="proposal-team-request-status">Submitted</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
