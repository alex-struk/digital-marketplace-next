import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// opportunity-counters · refused — a vendor, or a request with no session, asks for an opportunity's view count and is
// refused as not permitted.
// Not a screen: the address answers with data. This response reference names the parts of the request and the answer.
const meta: Meta = { title: "opportunities/opportunity-counters/refused" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Refused: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
          <Heading level={1}>An opportunity’s view count, by request</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="opportunity-counters-request">
          <Heading level={2} id="opportunity-counters-request">Request</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Read the view count</dt>
              <dd>/api/counters?counters=opportunity.code-with-us.&lt;opportunity identifier&gt;.views</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd>A vendor, or a request with no session</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="opportunity-counters-answer">
          <Heading level={2} id="opportunity-counters-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd data-testid="opportunity-counters-refused">Refused: not permitted</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>What changed</dt>
              <dd>Nothing. No count is given.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
