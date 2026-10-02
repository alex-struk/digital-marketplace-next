import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-cwu-request · refused — a vendor who already holds a proposal on the opportunity sends a second one, and the
// service refuses it; no second proposal is created (R-2.2). A refused request leaves nothing behind.
// Not a screen: the address answers with data. This response reference names the parts of the requests and the answer.
const meta: Meta = { title: "proposals/proposal-cwu-request/refused" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Refused: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
          <Heading level={1}>A Code With Us proposal, by request</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="proposal-cwu-request-requests">
          <Heading level={2} id="proposal-cwu-request-requests">Requests</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Submit with an organization as proponent</dt>
              <dd data-testid="proposal-cwu-request-submit-organization">
                Sent to /api/proposals/code-with-us, sending the opportunity, the organization, the proposal text and the
                additional comments, as a submission rather than a draft
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Submit with an individual as proponent</dt>
              <dd data-testid="proposal-cwu-request-submit-individual">
                Sent to /api/proposals/code-with-us, sending the opportunity, the proposal text, the additional comments and the
                individual's details, each exactly as given, for an opportunity the vendor already has a proposal on
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd>The signed-in vendor</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="proposal-cwu-request-answer">
          <Heading level={2} id="proposal-cwu-request-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Proposal accepted</dt>
              <dd data-testid="proposal-cwu-request-accepted">No</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Refusal status</dt>
              <dd data-testid="proposal-cwu-request-refusal-status">Refused (the criteria do not state the status)</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Messages, by field</dt>
              <dd>
                <Stack as="ul" gap="small" data-testid="proposal-cwu-request-refusal-by-field">
                  <li>
                    The field the service reports it against: “You already have a proposal for this opportunity.” (the
                    criteria do not name the field)
                  </li>
                </Stack>
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Messages, in the service's order</dt>
              <dd>
                <Stack as="ol" gap="small" data-testid="proposal-cwu-request-refusal-messages">
                  <li>You already have a proposal for this opportunity.</li>
                </Stack>
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>What changed</dt>
              <dd>Nothing. No second proposal is created.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
