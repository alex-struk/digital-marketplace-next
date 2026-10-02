import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// opportunity-counters · default — an administrator reads how many times an opportunity's public page has been
// opened (R-1.6). An opportunity never opened has no counter and reads as 0.
// Not a screen: the address answers with data. This response reference names the parts of the request and the answer.
const meta: Meta = { title: "opportunities/opportunity-counters/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Default: StoryObj = {
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
              <dd>An administrator or public sector staff</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="opportunity-counters-answer">
          <Heading level={2} id="opportunity-counters-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Views</dt>
              <dd data-testid="opportunity-counters-view-count">Illustrative: 12</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>When there is no counter yet</dt>
              <dd>The answer leaves the counter out, which reads as 0.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
