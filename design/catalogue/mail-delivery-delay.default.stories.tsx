import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// mail-delivery-delay · default — the control, beside the mail catcher, for a mail server that is slow to answer. Not
// a screen of the service (origin: mail-catcher). This response reference names the control's two requests and what
// it reports. Its test IDs stay null (DESIGN.md, notifications gap 14).
const meta: Meta = { title: "notifications/mail-delivery-delay/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { overflowWrap: "anywhere" } as const;

const requests: { term: string; detail: string }[] = [
  { term: "Address", detail: "/hold/proxies/smtp/toxics" },
  { term: "Slow delivery", detail: "Every reply the mail server makes reaches the service three seconds late. Nothing is refused or lost" },
  { term: "Restore delivery speed", detail: "The delay is lifted. Messages already on their way arrive" },
];

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address is the mail catcher's, not the service's</Text>
          <Heading level={1}>A mail server that is slow to answer</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="mail-delivery-delay-request">
          <Heading level={2} id="mail-delivery-delay-request">Requests</Heading>
          <Stack as="dl" gap="medium">
            {requests.map((request) => (
              <Stack gap="small" key={request.term}>
                <dt style={term}>{request.term}</dt>
                <dd style={detail}>{request.detail}</dd>
              </Stack>
            ))}
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="mail-delivery-delay-answer">
          <Heading level={2} id="mail-delivery-delay-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Delivery slowed</dt>
              <dd style={detail}>Whether the delay is in force</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
