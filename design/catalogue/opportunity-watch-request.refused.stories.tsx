import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// opportunity-watch-request · refused — the person who created the opportunity asks to watch it and is refused under
// "opportunity" with the message R-1.5's note gives. A duplicate watch is refused the same way under "conflict"
// (its words are not stated; see DESIGN.md, opportunities gap 27).
// Not a screen: the address answers with data. This response reference names the parts of the request and the answer.
const meta: Meta = { title: "opportunities/opportunity-watch-request/refused" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Refused: StoryObj = {
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
              <dt style={term}>Asked by</dt>
              <dd>The person who created the opportunity</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="opportunity-watch-answer">
          <Heading level={2} id="opportunity-watch-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd data-testid="opportunity-watch-request-refusal-status">Refused (the criteria do not state the status)</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Filed under</dt>
              <dd data-testid="opportunity-watch-request-refusal-reason">opportunity</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Messages, in the order given</dt>
              <dd>
                <Stack as="ol" gap="small" data-testid="opportunity-watch-request-refusal-messages">
                  <li>You cannot subscribe to your own opportunity.</li>
                </Stack>
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Watching, as the opportunity reports it</dt>
              <dd data-testid="opportunity-watch-request-watching">No</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>What changed</dt>
              <dd>Nothing.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
