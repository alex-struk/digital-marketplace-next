import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// evaluation-individual-request-swu · default — an evaluator starts an evaluation of a proponent by request, then saves a
// draft in which question 1's score is above its maximum and question 2's comment is empty. Both are accepted and stored
// as sent: a draft is not checked (R-5.21, R-5.23).
// Not a screen: the address answers with data. This response reference names the parts of the requests and the answer.
const meta: Meta = { title: "evaluation/evaluation-individual-request-swu/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
          <Heading level={1}>A Sprint With Us individual evaluation, by request</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="evaluation-individual-request-requests">
          <Heading level={2} id="evaluation-individual-request-requests">Requests</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Start an evaluation</dt>
              <dd data-testid="evaluation-individual-request-create">
                POST /api/proposal/sprint-with-us/&lt;proposal&gt;/team-questions/evaluations, sending the proposal, the status
                DRAFT and a score and comment for each of the four questions. The evaluator is taken from the session.
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Save a draft as entered</dt>
              <dd data-testid="evaluation-individual-request-save-draft">
                PUT /api/proposal/sprint-with-us/&lt;proposal&gt;/team-questions/evaluations/&lt;evaluator&gt;, tagged edit,
                sending the four scores and comments exactly as given
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd>An evaluator on the panel, while the opportunity is in individual question evaluation</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="evaluation-individual-request-answer">
          <Heading level={2} id="evaluation-individual-request-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Evaluation started</dt>
              <dd data-testid="evaluation-individual-request-created">Yes: the service answers with the new evaluation</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Status</dt>
              <dd data-testid="evaluation-individual-request-status">Draft</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Scores as stored, by question order</dt>
              <dd>
                <Stack as="ol" gap="small" data-testid="evaluation-individual-request-stored-scores">
                  <li>6 (question 1 is worth 5; a draft is stored as sent)</li>
                  <li>3</li>
                  <li>4</li>
                  <li>2.5</li>
                </Stack>
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Comments as stored, by question order</dt>
              <dd>
                <Stack as="ol" gap="small" data-testid="evaluation-individual-request-stored-notes">
                  <li>Clear plan with named methods.</li>
                  <li>(empty)</li>
                  <li>Staged cut-over is credible.</li>
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
