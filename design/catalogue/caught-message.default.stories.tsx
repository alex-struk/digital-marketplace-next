import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// caught-message · default — one message the service sent, read back from the mail catcher by its identifier. Not a
// screen of the service: the catcher answers with the message's headers and bodies (origin: mail-catcher). This
// response reference names each part of the answer the surface reads. Its test IDs stay null (DESIGN.md,
// notifications gap 14).
const meta: Meta = { title: "notifications/caught-message/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { overflowWrap: "anywhere" } as const;

const parts: { term: string; detail: string }[] = [
  { term: "Visible recipients", detail: "The addresses the message was sent to openly" },
  { term: "Copied recipients", detail: "The addresses the message was copied to" },
  { term: "Sender", detail: "The address the message came from" },
  { term: "Reply to", detail: "The address a reply goes to" },
  { term: "Subject", detail: "The message's subject line" },
  { term: "Formatted body", detail: "The message as a mail program that shows formatting displays it" },
  { term: "Plain text body", detail: "The message as a mail program that shows plain text displays it" },
  { term: "Logo address", detail: "The address of the image at the top of the formatted body" },
  { term: "Links in the body", detail: "Every link in the formatted body, each as its label and where it leads" },
];

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address is the mail catcher's, not the service's</Text>
          <Heading level={1}>A message the service sent</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="caught-message-request">
          <Heading level={2} id="caught-message-request">Request</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Address</dt>
              <dd style={detail}>/api/v1/message/:messageId, where :messageId is the catcher's own identifier for the message</dd>
            </Stack>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="caught-message-answer">
          <Heading level={2} id="caught-message-answer">Answer</Heading>
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
