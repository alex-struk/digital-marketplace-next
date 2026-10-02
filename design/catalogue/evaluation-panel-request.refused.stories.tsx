import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// evaluation-panel-request · refused — the owner sends, without the form, a panel naming a member who is neither an
// evaluator nor the chair, and separately a panel of two evaluators with no chair. The service refuses both, naming the
// member in the first, and the opportunity keeps the panel it had (R-5.1, R-5.9, R-5.37). The messages are the panel
// form's (DESIGN.md, evaluation gap 6).
// Not a screen: the address answers with data. This response reference names the parts of the requests and the answer.
const meta: Meta = { title: "evaluation/evaluation-panel-request/refused" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Refused: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
          <Heading level={1}>An evaluation panel, by request</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="evaluation-panel-request-requests">
          <Heading level={2} id="evaluation-panel-request-requests">Requests</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>A member with no role</dt>
              <dd data-testid="evaluation-panel-request-member-no-role">
                PUT /api/opportunities/sprint-with-us/&lt;opportunity&gt;, tagged editEvaluationPanel, naming Test Evaluator
                One as evaluator and chair and Test Evaluator Two as neither
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>No chair</dt>
              <dd data-testid="evaluation-panel-request-no-chair">
                PUT to the same address, tagged editEvaluationPanel, naming two public sector employees, both evaluators and
                neither the chair
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd>The opportunity's owner, while the panel may still be changed</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="evaluation-panel-request-answer">
          <Heading level={2} id="evaluation-panel-request-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Member with no role, refused</dt>
              <dd data-testid="evaluation-panel-request-member-without-role-error">
                Panel member 2: Test Evaluator Two must be an evaluator, the chair, or both.
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>No chair, refused</dt>
              <dd data-testid="evaluation-panel-request-missing-chair-error">
                Choose a chair. The panel needs one person to record the agreed scores.
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Panel as stored, unchanged</dt>
              <dd>
                <Stack as="ol" gap="small" data-testid="evaluation-panel-request-panel-as-stored">
                  <li>Test Evaluator One: evaluator and chair</li>
                  <li>Test Evaluator Two: evaluator</li>
                </Stack>
              </dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
