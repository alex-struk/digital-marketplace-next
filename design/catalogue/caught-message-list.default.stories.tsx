import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// caught-message-list · default — every message in the mail catcher, newest first. Not a screen of the service: the
// catcher answers with its listing (origin: mail-catcher). The nth identifier, subject and visible recipient belong to
// the same message. This response reference names each part of the answer the surface reads. Its test IDs stay null
// (DESIGN.md, notifications gap 14).
const meta: Meta = { title: "notifications/caught-message-list/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { overflowWrap: "anywhere" } as const;

const parts: { term: string; detail: string }[] = [
  { term: "Message identifiers", detail: "The catcher's identifier of each message, newest first" },
  { term: "Message subjects", detail: "The subject of each message, in the same order" },
  { term: "Visible recipients", detail: "The visible recipients of each message, in the same order" },
  { term: "Message count", detail: "How many messages the catcher holds" },
];

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address is the mail catcher's, not the service's</Text>
          <Heading level={1}>Every message the service sent</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="caught-message-list-request">
          <Heading level={2} id="caught-message-list-request">Request</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Address</dt>
              <dd style={detail}>/api/v1/messages</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="caught-message-list-answer">
          <Heading level={2} id="caught-message-list-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            {parts.map((part) => (
              <Stack gap="small" key={part.term}>
                <dt style={term}>{part.term}</dt>
                <dd style={detail}>{part.detail}</dd>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
