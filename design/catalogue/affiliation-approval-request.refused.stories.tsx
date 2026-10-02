import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// affiliation-approval-request · refused — the organization's owner tries to accept a pending invitation on the invited
// person's behalf. The request is refused and the membership stays pending (R-3.9). The criteria do not give the
// permission message's words, so the message below is a placeholder (see DESIGN.md, organizations gap 17).
// Not a screen: the address answers with data. This response reference names the parts of the request and the answer.
const meta: Meta = { title: "organizations/affiliation-approval-request/refused" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Refused: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
          <Heading level={1}>Accept a membership, by request</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="affiliation-approval-request">
          <Heading level={2} id="affiliation-approval-request">Request</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Accept a membership</dt>
              <dd data-testid="affiliation-approval-request-accept">
                PUT /api/affiliations/7c41e2d0-93a5-4b8e-a1f6-000000000301, sending the approve action
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd>Anyone but the invited person, such as the organization’s owner</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="affiliation-approval-answer">
          <Heading level={2} id="affiliation-approval-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd data-testid="affiliation-approval-request-refusal-status">Refused: not permitted</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Messages, in the order given</dt>
              <dd>
                <Stack as="ol" gap="small" data-testid="affiliation-approval-request-refusal-messages">
                  <li>Placeholder: the service’s permission message, whose words the criteria do not give</li>
                </Stack>
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>What changed</dt>
              <dd>Nothing. The membership is still pending.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
