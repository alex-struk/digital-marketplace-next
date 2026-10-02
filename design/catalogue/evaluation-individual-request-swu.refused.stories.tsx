import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// evaluation-individual-request-swu · refused — an evaluator asks for one complete draft to be submitted by itself and is
// refused as unrecognised; the evaluation stays a draft (R-5.26). A draft saved with an out-of-range score is refused
// when the evaluator's set is submitted, with R-5.25's message, and nothing is submitted (R-5.23, R-5.25).
// Not a screen: the address answers with data. This response reference names the parts of the requests and the answer.
const meta: Meta = { title: "evaluation/evaluation-individual-request-swu/refused" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Refused: StoryObj = {
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
              <dt style={term}>Submit this evaluation alone</dt>
              <dd data-testid="evaluation-individual-request-submit-alone">
                PUT /api/proposal/sprint-with-us/&lt;proposal&gt;/team-questions/evaluations/&lt;evaluator&gt;, tagged
                submit, for one complete draft
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Save a draft as entered</dt>
              <dd data-testid="evaluation-individual-request-save-draft">
                PUT to the same address, tagged edit, with question 1's score above its maximum and question 2's comment
                empty, followed by the evaluator submitting their scores for consensus
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
              <dt style={term}>Submitting one evaluation alone</dt>
              <dd data-testid="evaluation-individual-request-refused-unrecognised">
                Refused: the request is not recognised (the criteria do not state the status)
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Submitting the set with this draft in it</dt>
              <dd data-testid="evaluation-individual-request-refused-at-submission">
                Refused: “This evaluation could not be submitted for review because it is incomplete. Please edit, complete
                and save the appropriate form before trying to submit it again.”
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Status</dt>
              <dd data-testid="evaluation-individual-request-status">Draft</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Scores as stored, by question order</dt>
              <dd>
                <Stack as="ol" gap="small" data-testid="evaluation-individual-request-stored-scores">
                  <li>6</li>
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
            <Stack gap="small">
              <dt style={term}>What changed</dt>
              <dd>Nothing. No evaluation is submitted.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
