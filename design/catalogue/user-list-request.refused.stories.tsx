import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// user-list-request · refused — a public sector employee who is not an administrator, a vendor, or a visitor who is
// not signed in asks for the list of everyone registered and is refused rather than answered, so no email address or
// account status is disclosed (R-4.21). Not a screen: the address answers with data. This response reference names
// the answer.
const meta: Meta = { title: "users/user-list-request/refused" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { overflowWrap: "anywhere" } as const;

export const Refused: StoryObj = {
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
              <dd style={detail}>Anyone but an administrator, signed in or not</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="user-list-request-answer">
          <Heading level={2} id="user-list-request-answer">Answer</Heading>
          <Stack as="dl" gap="medium" data-testid="user-list-request-refused">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd style={detail} data-testid="user-list-request-refusal-status">Refused: not permitted</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Accounts</dt>
              <dd style={detail}>None. The answer carries no account, email address or account status.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
