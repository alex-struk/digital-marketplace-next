import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// opportunity-history-request · withheld — a reader who is neither the author nor an administrator (a vendor, or
// nobody signed in) reads the opportunity; the answer is the opportunity as usual with no history at all (R-1.33).
// Not a screen: the address answers with data. This response reference names the parts of the request and the answer.
const meta: Meta = { title: "opportunities/opportunity-history-request/withheld" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Withheld: StoryObj = {
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
              <dt style={term}>Read the opportunity</dt>
              <dd>A request to /api/opportunities/code-with-us/:opportunityId</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd>A vendor, or nobody signed in</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="opportunity-history-answer">
          <Heading level={2} id="opportunity-history-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>History included</dt>
              <dd data-testid="opportunity-history-request-history-shown">No</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>History, newest first</dt>
              <dd data-testid="opportunity-history-request-entries">None: no note and no attachment is in the answer.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
