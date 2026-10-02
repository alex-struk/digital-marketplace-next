import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-cwu-request · default — a signed-in vendor makes and submits a Code With Us proposal in one request, and the
// service accepts it. The proponent is an organization or an individual, each exactly as given (R-2.1, R-2.2).
// Not a screen: the address answers with data. This response reference names the parts of the requests and the answer.
const meta: Meta = { title: "proposals/proposal-cwu-request/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Default: StoryObj = {
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
                individual's legal name, email address, phone, street address, second address line, city, province, postal
                code and country, each exactly as given, as a submission rather than a draft
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
              <dd data-testid="proposal-cwu-request-accepted">Yes: the service answers with the new proposal</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Proposal</dt>
              <dd data-testid="proposal-cwu-request-proposal-id">The new proposal's identifier, for its edit and view pages</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Status</dt>
              <dd data-testid="proposal-cwu-request-status">Submitted</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
