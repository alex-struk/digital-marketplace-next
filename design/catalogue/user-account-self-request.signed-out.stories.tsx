import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// user-account-self-request · signed-out — a visitor who is not signed in asks for their own account record and is
// answered with no account at all, so the identifier and the notices moment are both empty. Not a screen: the address
// answers with data. This response reference names each part of the answer.
const meta: Meta = { title: "users/user-account-self-request/signed-out" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { overflowWrap: "anywhere" } as const;

export const SignedOut: StoryObj = {
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
              <dd style={detail}>A visitor who is not signed in</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="user-account-self-request-answer">
          <Heading level={2} id="user-account-self-request-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Account identifier</dt>
              <dd style={detail} data-testid="user-account-self-id">Empty: no account is answered</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>New-opportunity notices since</dt>
              <dd style={detail} data-testid="user-account-self-notices-since">Empty</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
