import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// user-list-request · default — an administrator asks for the list of everyone registered with the service and is
// answered with every account, each with its email address and account status (R-4.14, R-4.21). Not a screen: the
// address answers with data. This response reference names each part of the answer.
const meta: Meta = { title: "users/user-list-request/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { overflowWrap: "anywhere" } as const;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
          <Heading level={1}>Everyone registered with the service</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="user-list-request-request">
          <Heading level={2} id="user-list-request-request">Request</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Address</dt>
              <dd style={detail}>/api/users</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd style={detail}>An administrator</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="user-list-request-answer">
          <Heading level={2} id="user-list-request-answer">Answer</Heading>
          <Stack as="dl" gap="medium" data-testid="user-list-request-accounts">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd style={detail}>Answered</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Accounts</dt>
              <dd style={detail}>
                Every registered account, active and deactivated, each with its identifier, name, email address, account
                kind, account status and whether it is an administrator
              </dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
