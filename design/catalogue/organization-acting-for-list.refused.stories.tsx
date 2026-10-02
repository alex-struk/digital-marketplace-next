import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// organization-acting-for-list · refused — a signed-in member of public sector staff, or a visitor who is not signed in,
// asks for the organizations they may act for. The request is refused as not permitted, never answered with an empty
// list (R-3.20, which replaces R-3.16).
// Not a screen: the address answers with data. This response reference names the parts of the answer.
const meta: Meta = { title: "organizations/organization-acting-for-list/refused" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Refused: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
          <Heading level={1}>Organizations one may act for</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="organization-acting-for-request">
          <Heading level={2} id="organization-acting-for-request">Request</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Ask for the organizations one may act for</dt>
              <dd>GET /api/ownedOrganizations</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd>Anyone who is not a signed-in vendor: public sector staff, an administrator, or a visitor who is not signed in</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="organization-acting-for-answer">
          <Heading level={2} id="organization-acting-for-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd data-testid="organization-acting-for-list-refused">Refused: not permitted</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Organizations offered</dt>
              <dd>None. The answer is a refusal, not an empty list, so it cannot be mistaken for a vendor with no organizations.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
