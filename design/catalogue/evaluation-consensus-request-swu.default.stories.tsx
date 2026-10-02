import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// evaluation-consensus-request-swu · default — the chair changes a consensus by request while the opportunity is in
// consensus; the change is accepted, and an administrator reads back what it holds (R-5.28, R-5.29, R-5.30)
// Not a screen: the address answers with data. This response reference names the parts of the request and the answer.
const meta: Meta = { title: "evaluation/evaluation-consensus-request-swu/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
          <Heading level={1}>A Sprint With Us consensus, by request</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="evaluation-consensus-request-requests">
          <Heading level={2} id="evaluation-consensus-request-requests">Request</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Change the consensus</dt>
              <dd data-testid="evaluation-consensus-request-change">
                PUT /api/proposal/sprint-with-us/&lt;proposal&gt;/team-questions/consensus/&lt;chair&gt;, tagged edit, sending
                an agreed score and comment for each of the four questions, by question order
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd>The panel's chair, while the opportunity is in consensus; read back by an administrator</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="evaluation-consensus-request-answer">
          <Heading level={2} id="evaluation-consensus-request-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd data-testid="evaluation-consensus-request-accepted">Accepted: the service answers with the consensus</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Status</dt>
              <dd data-testid="evaluation-consensus-request-status">Submitted</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Agreed scores as stored, by question order</dt>
              <dd>
                <Stack as="ol" gap="small" data-testid="evaluation-consensus-request-stored-scores">
                  <li>4</li>
                  <li>7.5</li>
                  <li>8</li>
                  <li>3</li>
                </Stack>
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Agreed comments as stored, by question order</dt>
              <dd>
                <Stack as="ol" gap="small" data-testid="evaluation-consensus-request-stored-notes">
                  <li>Clear plan covering both user groups.</li>
                  <li>Credible staged cut-over.</li>
                  <li>Strong delivery record.</li>
                  <li>References are recent and relevant.</li>
                </Stack>
              </dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
