import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// user-account-request · refused — somebody who is neither the account's owner nor an administrator asks for the
// account record and is refused rather than answered (R-4.25). In the interface the same refusal is shown as a
// missing page; here it is the answer itself. Not a screen: the address answers with data. This response reference
// names the answer.
const meta: Meta = { title: "users/user-account-request/refused" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { overflowWrap: "anywhere" } as const;

export const Refused: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address answers with data, not a page</Text>
          <Heading level={1}>An account record</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="user-account-request-request">
          <Heading level={2} id="user-account-request-request">Request</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Address</dt>
              <dd style={detail}>/api/users/7c1d9e42-3a5b-4f80-9e21-000000000401</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Asked by</dt>
              <dd style={detail}>Another vendor, who is neither the account's owner nor an administrator</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="user-account-request-answer">
          <Heading level={2} id="user-account-request-answer">Answer</Heading>
          <Stack as="dl" gap="medium" data-testid="user-account-refused">
            <Stack gap="small">
              <dt style={term}>Outcome</dt>
              <dd style={detail} data-testid="user-account-refusal-status">Refused: not permitted</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Account record</dt>
              <dd style={detail}>None. The answer carries nothing from the account.</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
