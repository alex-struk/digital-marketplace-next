import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// mail-delivery-fault · default — the mail catcher's control for a mail server that refuses delivery. Not a screen of
// the service (origin: mail-catcher). This response reference names the control's two requests and what it reports.
// Its test IDs stay null (DESIGN.md, notifications gap 14).
const meta: Meta = { title: "notifications/mail-delivery-fault/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { overflowWrap: "anywhere" } as const;

const requests: { term: string; detail: string }[] = [
  { term: "Address", detail: "/api/v1/chaos" },
  { term: "Refuse delivery", detail: "Every message the service tries to send from now on is refused at the start of the attempt" },
  { term: "Restore delivery", detail: "Delivery is accepted again. Messages refused earlier stay refused" },
];

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Response reference: this address is the mail catcher's, not the service's</Text>
          <Heading level={1}>A mail server that refuses delivery</Heading>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="mail-delivery-fault-request">
          <Heading level={2} id="mail-delivery-fault-request">Requests</Heading>
          <Stack as="dl" gap="medium">
            {requests.map((request) => (
              <Stack gap="small" key={request.term}>
                <dt style={term}>{request.term}</dt>
                <dd style={detail}>{request.detail}</dd>
              </Stack>
            ))}
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="mail-delivery-fault-answer">
          <Heading level={2} id="mail-delivery-fault-answer">Answer</Heading>
          <Stack as="dl" gap="medium">
            <Stack gap="small">
              <dt style={term}>Delivery refused</dt>
              <dd style={detail}>Whether the fault is in force</dd>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
