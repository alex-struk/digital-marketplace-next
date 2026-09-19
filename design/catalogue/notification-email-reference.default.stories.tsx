import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// notification-email-reference · default — a signed-in administrator opens the reference page. Every message the
// service can send is shown, grouped under the event that sends it, each with its subject, the one-line summary of who
// receives it and why where one is written, and its body as a recipient would see it, built from invented sample data
// (R-6.13, R-6.19). The build lists every message; this story shows five events as a pattern. Their subjects, summaries
// and bodies are placeholders, because no criterion gives the content of any message (DESIGN.md, notifications gap 9).
const meta: Meta = { title: "notifications/notification-email-reference/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const plainList = { display: "grid", gap: "var(--layout-margin-small)", margin: "var(--layout-margin-none)" } as const;
const facts = { display: "grid", gap: "var(--layout-margin-small)", margin: "var(--layout-margin-none)" } as const;
const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { margin: "var(--layout-margin-none)" } as const;
const message = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  paddingBlockStart: "var(--layout-padding-large)",
  borderBlockStart: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;
const body = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const emailTitle = { fontWeight: "var(--typography-font-weights-bold)" } as const;

type Message = {
  id: string;
  recipient: string;
  subject: string;
  summary?: string;
  title: string;
  paragraphs: string[];
  link?: { text: string; href: string };
  footer: { text: string; href: string };
};
type Group = { id: string; event: string; messages: Message[] };

// Messages the notification preference governs end with Unsubscribe (R-6.6); every other message links to the
// reader's settings without offering to stop it (R-6.16).
const unsubscribe = { text: "Unsubscribe", href: "/users/me?tab=notifications&unsubscribe" };
const settings = { text: "Manage your notification settings", href: "/users/me?tab=notifications" };

const groups: Group[] = [
  {
    id: "cwu-published",
    event: "A Code With Us opportunity is published",
    messages: [
      {
        id: "cwu-published-subscribers",
        recipient: "To everyone who asked to be emailed about new opportunities",
        subject: "A new Code With Us opportunity has been posted",
        summary: "Sent in batches of up to fifty, each recipient hidden from the others, to every active account that asked for new-opportunity emails.",
        title: "Sample opportunity title",
        paragraphs: ["Placeholder: the message's wording is not in the spec.", "Reward: $10,000 · Proposal deadline: sample date"],
        link: { text: "View this opportunity", href: "/opportunities" },
        footer: unsubscribe,
      },
    ],
  },
  {
    id: "cwu-submitted-for-review",
    event: "A Code With Us opportunity is submitted for review",
    messages: [
      {
        id: "cwu-review-administrators",
        recipient: "To administrators",
        subject: "A Code With Us opportunity is ready for review",
        summary: "Sent to every administrator when a public sector employee submits an opportunity for review.",
        title: "Sample opportunity title",
        paragraphs: ["Placeholder: the message's wording is not in the spec."],
        link: { text: "Review this opportunity", href: "/opportunities" },
        footer: settings,
      },
      {
        id: "cwu-review-author",
        recipient: "To the opportunity's author",
        subject: "Your Code With Us opportunity has been submitted for review",
        title: "Sample opportunity title",
        paragraphs: ["Placeholder: the message's wording is not in the spec."],
        footer: settings,
      },
    ],
  },
  {
    id: "swu-panel-named",
    event: "A Sprint With Us evaluation panel is named",
    messages: [
      {
        id: "swu-panel-members",
        recipient: "To the members of the evaluation panel",
        subject: "You have been named to a Sprint With Us evaluation panel",
        summary: "Sent in batches, each recipient hidden from the others, to the panel members named on the opportunity.",
        title: "Sample opportunity title",
        paragraphs: ["Placeholder: the message's wording is not in the spec."],
        footer: settings,
      },
    ],
  },
  {
    id: "cwu-not-awarded",
    event: "A Code With Us proposal is not awarded",
    messages: [
      {
        id: "cwu-not-awarded-proponents",
        recipient: "To each proponent who was not chosen",
        subject: "A Code With Us opportunity you proposed on has been awarded",
        summary: "Sent to every proponent whose proposal was not the one awarded.",
        title: "Sample opportunity title",
        paragraphs: ["Awarded to: Sample Organization Ltd.", "Placeholder: the rest of the message's wording is not in the spec."],
        link: { text: "Sign in to see your score", href: "/sign-in" },
        footer: settings,
      },
    ],
  },
  {
    id: "terms-updated",
    event: "The terms and conditions are updated",
    messages: [
      {
        id: "terms-updated-vendors",
        recipient: "To every active vendor",
        subject: "The Digital Marketplace terms and conditions have changed",
        summary: "Sent to every active vendor, one message each, when an administrator announces changed terms.",
        title: "Please review the updated terms and conditions",
        paragraphs: [
          "You need to accept the new terms before you can submit proposals to Code With Us, Sprint With Us or Team With Us.",
          "Placeholder: the rest of the message's wording is not in the spec.",
        ],
        link: { text: "Read and accept the new terms", href: "/users/me?tab=legal" },
        footer: settings,
      },
    ],
  },
];

export const Default: StoryObj = {
  render: () => (
    <div style={page} data-testid="email-reference-page">
      <Heading level={1}>Email Notification Reference</Heading>
      <Text elementType="p">
        Every email the service sends, shown as its recipient would see it. The names, addresses and records in these
        samples are invented.
      </Text>
      <nav aria-labelledby="email-reference-contents">
        <div style={stack}>
          <Heading level={2} id="email-reference-contents">Events that send email</Heading>
          <ul style={plainList}>
            {groups.map((g) => (
              <li key={g.id}><Link href={`#${g.id}`}>{g.event}</Link></li>
            ))}
          </ul>
        </div>
      </nav>
      {groups.map((g) => (
        <section key={g.id} aria-labelledby={g.id} style={stack}>
          <Heading level={2} id={g.id}>
            <span data-testid="email-reference-group-title">{g.event}</span>
          </Heading>
          {g.messages.map((m) => (
            <article key={m.id} aria-labelledby={m.id} style={message}>
              <Heading level={3} id={m.id}>{m.recipient}</Heading>
              <dl style={facts}>
                <div>
                  <dt style={term}>Subject</dt>
                  <dd style={detail} data-testid="email-reference-subject">{m.subject}</dd>
                </div>
                {m.summary && (
                  <div>
                    <dt style={term}>Who receives it and why</dt>
                    <dd style={detail} data-testid="email-reference-summary">{m.summary}</dd>
                  </div>
                )}
              </dl>
              <div role="group" aria-label={`Email body: ${m.subject}`} style={body} data-testid="email-reference-body">
                <Text elementType="p"><span style={emailTitle}>{m.title}</span></Text>
                {m.paragraphs.map((p) => (
                  <Text key={p} elementType="p">{p}</Text>
                ))}
                {m.link && <Text elementType="p"><Link href={m.link.href}>{m.link.text}</Link></Text>}
                <Text elementType="p" size="small" color="secondary"><Link href={m.footer.href}>{m.footer.text}</Link></Text>
              </div>
            </article>
          ))}
        </section>
      ))}
    </div>
  ),
};
