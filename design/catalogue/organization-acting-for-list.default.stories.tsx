import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// organization-acting-for-list · default — a signed-in vendor who owns one organization, administers a second, is an
// ordinary member of a third and owns a fourth that has been archived asks for the organizations they may act for. The
// first two are answered; the third and fourth are not (R-3.15).
// Not a screen: the address answers with data. This response reference names the parts of the answer.
const meta: Meta = { title: "organizations/organization-acting-for-list/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Default: StoryObj = {
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
              <dd>A signed-in vendor</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="organization-acting-for-answer">
          <Heading level={2} id="organization-acting-for-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd>Answered</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Organizations offered</dt>
              <dd>
                <Stack as="ul" gap="small" data-testid="organization-acting-for-list-organizations">
                  <li>Northwind Digital Co-operative (owned)</li>
                  <li>Pacific Service Design Ltd. (administered)</li>
                </Stack>
              </dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Not offered</dt>
              <dd>An organization the vendor is only an ordinary member of, and any archived organization, even one they own</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
