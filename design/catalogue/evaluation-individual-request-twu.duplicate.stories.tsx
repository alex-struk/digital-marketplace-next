import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// evaluation-individual-request-twu · duplicate — an evaluator who already holds a draft of the first proponent starts a
// second evaluation of it by request and is refused with R-5.3's message in its Team With Us wording; their draft still
// holds 3, 3, 3, 3 (R-5.3)
// Not a screen: the address answers with data. This response reference names the parts of the request and the answer.
const meta: Meta = { title: "evaluation/evaluation-individual-request-twu/duplicate" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Duplicate: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
          <Heading level={1}>A Team With Us individual evaluation, by request</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="evaluation-individual-request-requests">
          <Heading level={2} id="evaluation-individual-request-requests">Request</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Start an evaluation</dt>
              <dd data-testid="evaluation-individual-request-create">
                POST /api/proposal/team-with-us/&lt;proposal&gt;/resource-questions/evaluations, sending the proposal, the
                status DRAFT and a score and comment for each of the four questions
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd>An evaluator who already holds a draft evaluation of this proponent</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="evaluation-individual-request-answer">
          <Heading level={2} id="evaluation-individual-request-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Evaluation started</dt>
              <dd data-testid="evaluation-individual-request-created">No</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Refusal</dt>
              <dd data-testid="evaluation-individual-request-creation-refusal-message">
                You already have a resource question evaluation for this proposal.
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>The existing draft's scores, by question order</dt>
              <dd>
                <Stack as="ol" gap="small" data-testid="evaluation-individual-request-stored-scores">
                  <li>3</li>
                  <li>3</li>
                  <li>3</li>
                  <li>3</li>
                </Stack>
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>What changed</dt>
              <dd>Nothing. No second evaluation is created.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
