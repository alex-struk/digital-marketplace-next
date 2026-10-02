import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-team-request · refused — a Team With Us proposal names a person who is not an active member of the
// organization, and names another person twice; the service refuses it and nothing is created (R-2.18). A Sprint With
// Us phase naming one person twice passes validation and fails to store instead, answered with status 503.
// Not a screen: the address answers with data. This response reference names the parts of the request and the answer.
const meta: Meta = { title: "proposals/proposal-team-request/refused" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Refused: StoryObj = {
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
                Sent to /api/proposals/team-with-us, with a team naming a person whose membership of the organization is
                pending in position 1, and one person in both positions 2 and 3. Sent as a submission rather than a draft.
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
              <dd data-testid="proposal-team-request-accepted">No</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Refusal status</dt>
              <dd data-testid="proposal-team-request-refusal-status">400: refused at validation (503 when it fails to store)</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Messages, by where they are reported</dt>
              <dd>
                <Stack as="ul" gap="small" data-testid="proposal-team-request-refusal-by-field">
                  <li>Team, position 1: “User is not an active member of the organization.”</li>
                  <li>Team: “Please select unique team members.”</li>
                </Stack>
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Messages, in the service's order</dt>
              <dd>
                <Stack as="ol" gap="small" data-testid="proposal-team-request-refusal-messages">
                  <li>User is not an active member of the organization.</li>
                  <li>Please select unique team members.</li>
                </Stack>
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>What changed</dt>
              <dd>Nothing. No proposal is created.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
