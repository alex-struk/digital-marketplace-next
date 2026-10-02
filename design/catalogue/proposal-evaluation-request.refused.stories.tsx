import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-evaluation-request · refused — a team scenario score is sent for a proposal already carried into the team
// scenario while the Sprint With Us opportunity is still at its code challenge, and the service refuses it (R-2.28).
// Not a screen: the address answers with data. This response reference names the parts of the requests and the answer.
const meta: Meta = { title: "proposals/proposal-evaluation-request/refused" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Refused: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
          <Heading level={1}>A stage score, by request</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="proposal-evaluation-request-requests">
          <Heading level={2} id="proposal-evaluation-request-requests">Requests</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Score the team scenario</dt>
              <dd data-testid="proposal-evaluation-request-score-team-scenario">
                Sent to /api/proposals/sprint-with-us/&lt;proposal&gt;, sending a score out of 100 for the team scenario, while
                the opportunity is still at its code challenge
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Score the code challenge</dt>
              <dd data-testid="proposal-evaluation-request-score-code-challenge">
                Sent to /api/proposals/sprint-with-us/&lt;proposal&gt;, sending a score out of 100 for the code challenge
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Score the challenge</dt>
              <dd data-testid="proposal-evaluation-request-score-challenge">
                Sent to /api/proposals/team-with-us/&lt;proposal&gt;, sending a score out of 100 for the challenge
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd>Whoever is signed in; the administrator may score any stage the opportunity stands at</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="proposal-evaluation-request-answer">
          <Heading level={2} id="proposal-evaluation-request-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Score accepted</dt>
              <dd data-testid="proposal-evaluation-request-accepted">No</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Refusal status</dt>
              <dd data-testid="proposal-evaluation-request-refusal-status">Refused (the criteria do not state the status)</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Messages, in the service's order</dt>
              <dd>
                <Stack as="ol" gap="small" data-testid="proposal-evaluation-request-refusal-messages">
                  <li>The opportunity is not in the correct stage of evaluation to perform that action.</li>
                </Stack>
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>What changed</dt>
              <dd>Nothing. No score is recorded.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
