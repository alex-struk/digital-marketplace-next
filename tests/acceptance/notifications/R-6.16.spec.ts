// criterion: @R-6.16 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";

// The notification preference governs only the three new-opportunity announcements
// (spec/contract/observables.yaml, email.governed_by_notification_setting), so any other message
// is one it does not govern. The one used here is an invitation to join an organization: the
// owner of the seed's qualified organization invites users.vendorOne (persona.vendor), and the
// message is found by that person's address and read whole through caught-message.
//
// The message must offer nothing labelled as unsubscribing, and must say nothing of stopping or
// opting out of messages. Its link to the reader's notification settings is found among the
// links of its formatted body by what it says or where it leads, and followed with the reader
// signed in: it must land on their own notification settings, showing their own address, and
// not with the unsubscribe confirmation already asked.

const reader = seed.users.vendorOne;
const settle = { timeout: 30000 };

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

function decode(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#x27;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&");
}

function shownText(html: string): string {
  return decode(html.replace(/<(head|style|script|title)\b[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function links(html: string): Array<{ label: string; href: string }> {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((match) => ({
    label: shownText(match[2]),
    href: decode(/\bhref\s*=\s*["']([^"']*)["']/i.exec(match[1])?.[1] ?? ""),
  }));
}

test("A message that the notification preference does not govern must not offer to unsubscribe; it links to the reader's notification settings without implying that any choice there will stop messages of that kind.", async ({
  surface,
  mail,
}) => {
  await mail.clear();
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  await surface.organizationEdit.addTeamMembers({ emails: [reader.email] });
  await surface.signOut();

  await expect.poll(async () => (await mail.messagesTo(reader.email)).length, settle).toBeGreaterThan(0);
  const [message] = await mail.messagesTo(reader.email);

  await surface.caughtMessage.open({ messageId: message.ID });
  const html = await readOrEmpty(() => surface.caughtMessage.htmlBody());
  const plain = await readOrEmpty(() => surface.caughtMessage.plainTextBody());
  const listed = await readOrEmpty(() => surface.caughtMessage.linksInBody());
  const offered = links(html);

  expect(offered.filter((link) => /unsubscribe/i.test(link.label)), "links offering to unsubscribe").toEqual([]);
  expect(listed).not.toMatch(/unsubscribe/i);
  for (const text of [shownText(html), plain]) {
    expect(text).not.toMatch(/unsubscribe|opt[ -]out|stop (receiving|getting)|no longer receive/i);
  }

  const toSettings = offered.find((link) => /notification|setting|preference/i.test(`${link.label} ${link.href}`));
  expect(toSettings, "a link to the reader's notification settings").toBeTruthy();

  await surface.signIn(persona.vendor);
  await surface.caughtMessage.open({ messageId: message.ID });
  await surface.caughtMessage.followLinkInBody({ label: toSettings!.label });

  await expect
    .poll(() => readOrEmpty(() => surface.userProfileSelfNotifications.notificationEmailAddress()), settle)
    .toContain(reader.email);
  expect(await readOrEmpty(() => surface.userProfileSelfNotifications.newOpportunitiesCheckbox())).toBeTruthy();
  expect(await readOrEmpty(() => surface.notificationUnsubscribeLanding.unsubscribeConfirmation())).toBeFalsy();
});
