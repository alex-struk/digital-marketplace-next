import { useEffect, useState } from "react";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { mayReadEmailReference } from "@rules/users";
import { EmailBlock, EmailInline, ReferenceGroup, ReferenceMessage, readEmailReference } from "../api/notifications";
import { useSession } from "../auth/session";
import { Loading, useLoadingShown } from "../app/loading";
import { NotFound } from "../app/not-found";
import { Stack } from "../app/page-layout";
import { TitledAlert } from "../app/titled-alert";
import { useScreenTitle } from "../app/screen-title";

/**
 * notification-email-reference: every message the service can send, grouped under the event that
 * sends it, each with its subject, the one-line summary of who receives it and why where one is
 * written, and its body as a recipient sees it, built by the service from invented samples (R-6.13,
 * R-6.19). Each body ends as the sent message ends: Unsubscribe on a new-opportunity announcement,
 * the settings link on every other (R-6.6, R-6.16). Anybody but an administrator is shown the
 * missing page, and nothing is asked of the service.
 */

const TITLE = "Email Notification Reference";
const LOADING = "Loading sample emails…";

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
// Each message is set off from the one before by a rule, with the rule's own padding beneath it.
const messageStyle = {
  paddingBlockStart: "var(--layout-padding-large)",
  borderBlockStart: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;
// The email preview frame. Its border and inner padding are its own; its content is laid out by the stack.
const bodyStyle = {
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const emailTitle = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export function EmailNotificationReferenceScreen() {
  useScreenTitle(TITLE);
  const session = useSession();
  if (session.status === "starting") return <LoadingPage />;
  if (session.status !== "signed-in" || !mayReadEmailReference(session.account)) return <NotFound />;
  return <Reference />;
}

function LoadingPage() {
  return (
    <Stack gap="large" data-testid="email-reference-page">
      <Heading level={1}>{TITLE}</Heading>
      <Loading label={LOADING} />
    </Stack>
  );
}

type Reading = { status: "reading" } | Awaited<ReturnType<typeof readEmailReference>>;

function Reference() {
  const [reading, setReading] = useState<Reading>({ status: "reading" });
  const loadingShown = useLoadingShown(reading.status === "reading");

  useEffect(() => {
    let current = true;
    void readEmailReference().then((answer) => (current ? setReading(answer) : undefined));
    return () => {
      current = false;
    };
  }, []);

  if (reading.status === "reading") return loadingShown ? <LoadingPage /> : null;
  if (reading.status === "not-found") return <NotFound />;
  if (reading.status === "failed") {
    return (
      <Stack gap="large" data-testid="email-reference-page">
        <Heading level={1}>{TITLE}</Heading>
        <TitledAlert variant="danger" role="alert" title="The sample emails could not be loaded">
          <Text elementType="p">Reload the page to try again.</Text>
        </TitledAlert>
      </Stack>
    );
  }
  return <ReferencePage groups={reading.groups} />;
}

function ReferencePage({ groups }: { groups: readonly ReferenceGroup[] }) {
  return (
    <Stack gap="large" data-testid="email-reference-page">
      <Stack gap="medium">
        <Heading level={1}>{TITLE}</Heading>
        <Text elementType="p">
          Every email the service sends, shown as its recipient would see it. The names, addresses and records in these
          samples are invented.
        </Text>
      </Stack>
      <nav aria-labelledby="email-reference-contents">
        <Stack gap="medium">
          <Heading level={2} id="email-reference-contents">
            Events that send email
          </Heading>
          <Stack as="ul" gap="small">
            {groups.map((group) => (
              <li key={group.id}>
                <Link href={`#${group.id}`}>{group.event}</Link>
              </li>
            ))}
          </Stack>
        </Stack>
      </nav>
      {groups.map((group) => (
        <Stack as="section" key={group.id} gap="medium" aria-labelledby={group.id}>
          <Heading level={2} id={group.id}>
            <span data-testid="email-reference-group-title">{group.event}</span>
          </Heading>
          {group.messages.map((message) => (
            <SampleMessage key={message.id} message={message} />
          ))}
        </Stack>
      ))}
    </Stack>
  );
}

function SampleMessage({ message }: { message: ReferenceMessage }) {
  return (
    <article aria-labelledby={message.id} style={messageStyle}>
      <Stack gap="medium">
        <Heading level={3} id={message.id}>
          {message.recipient}
        </Heading>
        <Stack as="dl" gap="small">
          <div>
            <dt style={term}>Subject</dt>
            <dd data-testid="email-reference-subject">{message.subject}</dd>
          </div>
          {message.summary ? (
            <div>
              <dt style={term}>Who receives it and why</dt>
              <dd data-testid="email-reference-summary">{message.summary}</dd>
            </div>
          ) : null}
        </Stack>
        <div role="group" aria-label={`Email body: ${message.subject}`} style={bodyStyle} data-testid="email-reference-body">
          <Stack gap="medium">
            <Text elementType="p">
              <span style={emailTitle}>{message.title}</span>
            </Text>
            {message.body.map((block, index) => (
              <BodyBlock key={index} block={block} />
            ))}
            <Text elementType="p" size="small" color="secondary">
              <Inlines content={message.footer.kind === "paragraph" ? message.footer.content : [{ text: message.footer.label, href: message.footer.href }]} />
            </Text>
          </Stack>
        </div>
      </Stack>
    </article>
  );
}

function BodyBlock({ block }: { block: EmailBlock }) {
  return block.kind === "paragraph" ? (
    <Text elementType="p">
      <Inlines content={block.content} />
    </Text>
  ) : (
    <Text elementType="p">
      <Link href={block.href}>{block.label}</Link>
    </Text>
  );
}

function Inlines({ content }: { content: readonly EmailInline[] }) {
  return (
    <>
      {content.map((part, index) =>
        typeof part === "string" ? (
          <span key={index}>{part}</span>
        ) : (
          <Link key={index} href={part.href}>
            {part.text}
          </Link>
        ),
      )}
    </>
  );
}
