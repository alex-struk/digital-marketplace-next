import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// user-account-self-request · default — a signed-in person asks for their own account record and is answered with it,
// including the moment new-opportunity notices were turned on, or nothing when they are off (R-4.24, R-4.29). Not a
// screen: the address answers with data. This response reference names each part of the answer.
const meta: Meta = { title: "users/user-account-self-request/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { overflowWrap: "anywhere" } as const;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
          <Heading level={1}>One's own account record</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="user-account-self-request-request">
          <Heading level={2} id="user-account-self-request-request">Request</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Address</dt>
              <dd style={detail}>/api/sessions/current</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd style={detail}>A signed-in vendor who is being told about new opportunities</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="user-account-self-request-answer">
          <Heading level={2} id="user-account-self-request-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Account identifier</dt>
              <dd style={detail} data-testid="user-account-self-id">7c1d9e42-3a5b-4f80-9e21-000000000401</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>New-opportunity notices since</dt>
              <dd style={detail} data-testid="user-account-self-notices-since">
                2026-09-14T17:05:22.000Z. Empty when notices are off: turning them off clears the moment rather than
                recording when.
              </dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
