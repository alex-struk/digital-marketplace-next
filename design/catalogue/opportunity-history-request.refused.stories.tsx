import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// opportunity-history-request · refused — somebody who is neither the author nor an administrator asks to add a note,
// and the service refuses it; the history is unchanged (R-1.33). The refusal's status and words are not stated in the
// criteria (see DESIGN.md, opportunities gap 28).
// Not a screen: the address answers with data. This response reference names the parts of the request and the answer.
const meta: Meta = { title: "opportunities/opportunity-history-request/refused" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Refused: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
          <Heading level={1}>An opportunity’s history, by request</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="opportunity-history-request">
          <Heading level={2} id="opportunity-history-request">Request</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Add a note</dt>
              <dd data-testid="opportunity-history-request-add-note">
                An update to /api/opportunities/code-with-us/:opportunityId asking to add a note
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd>A vendor</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="opportunity-history-answer">
          <Heading level={2} id="opportunity-history-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd data-testid="opportunity-history-request-refusal-status">Refused (the criteria do not state the status)</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Messages, in the order given</dt>
              <dd>
                <Stack as="ol" gap="small" data-testid="opportunity-history-request-refusal-messages">
                  <li>The service’s permission message (its words are not stated)</li>
                </Stack>
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>What changed</dt>
              <dd>Nothing: no note is added to the history.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
