import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// opportunity-watch-request · default — a signed-in person asks to watch an opportunity somebody else created and
// the service accepts; asking to stop watching is the same request in reverse (R-1.5).
// Not a screen: the address answers with data. This response reference names the parts of the request and the answer.
const meta: Meta = { title: "opportunities/opportunity-watch-request/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
          <Heading level={1}>Watch an opportunity, by request</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="opportunity-watch-request">
          <Heading level={2} id="opportunity-watch-request">Request</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Watch an opportunity</dt>
              <dd data-testid="opportunity-watch-request-watch">
                A request to /api/subscribers/code-with-us asking to watch, naming the opportunity’s identifier
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Stop watching an opportunity</dt>
              <dd data-testid="opportunity-watch-request-stop">
                A request to /api/subscribers/code-with-us asking to stop watching, naming the opportunity’s identifier
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd>A signed-in person who did not create the opportunity</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="opportunity-watch-answer">
          <Heading level={2} id="opportunity-watch-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd data-testid="opportunity-watch-request-accepted">Accepted: the subscription is returned</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Watching, as the opportunity reports it</dt>
              <dd data-testid="opportunity-watch-request-watching">Yes</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>What changed</dt>
              <dd>The person now watches the opportunity and is told of its addenda and cancellation.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
