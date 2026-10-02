import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// evaluation-panel-request · default — the panel an opportunity holds, as the service answers it to its owner or an
// administrator: who is on it, and whether each is an evaluator, the chair, or both (R-5.1, R-5.18)
// Not a screen: the address answers with data. This response reference names the parts of the answer.
const meta: Meta = { title: "evaluation/evaluation-panel-request/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
          <Heading level={1}>An evaluation panel, by request</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="evaluation-panel-request-requests">
          <Heading level={2} id="evaluation-panel-request-requests">Request</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Read the opportunity</dt>
              <dd>GET /api/opportunities/sprint-with-us/&lt;opportunity&gt; (or team-with-us)</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd>The opportunity's owner or an administrator</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="evaluation-panel-request-answer">
          <Heading level={2} id="evaluation-panel-request-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Panel as stored</dt>
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
