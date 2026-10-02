import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// evaluation-consensus-request-swu · refused — an evaluator who is not the chair changes the chair's consensus by request,
// or anyone changes one after the opportunity has moved past consensus. The change is refused as not permitted and the
// consensus keeps what it held (R-5.29, R-5.30)
// Not a screen: the address answers with data. This response reference names the parts of the request and the answer.
const meta: Meta = { title: "evaluation/evaluation-consensus-request-swu/refused" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Refused: StoryObj = {
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
                an agreed score and comment for each of the four questions
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd>
                An evaluator who is not the chair, or anyone once the opportunity has moved past consensus; read back by an
                administrator
              </dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="evaluation-consensus-request-answer">
          <Heading level={2} id="evaluation-consensus-request-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd data-testid="evaluation-consensus-request-refused">Refused: not permitted</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Status, read back</dt>
              <dd data-testid="evaluation-consensus-request-status">Submitted</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Agreed scores, read back, by question order</dt>
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
              <dt style={term}>Agreed comments, read back, by question order</dt>
              <dd>
                <Stack as="ol" gap="small" data-testid="evaluation-consensus-request-stored-notes">
                  <li>Clear plan covering both user groups.</li>
                  <li>Credible staged cut-over.</li>
                  <li>Strong delivery record.</li>
                  <li>References are recent and relevant.</li>
                </Stack>
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>What changed</dt>
              <dd>Nothing. The consensus keeps what it held.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
