// criterion: @R-6.5 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// "Any message" is sampled by three messages of different kinds, each triggered by a different
// part of the service: an invitation to join an organization, the announcement of a newly
// published opportunity, and the announcement of changed terms. One message of each distinct
// subject is read whole through caught-message.
//
// "A rendering of the formatted version rather than separately written copy" is read as: every
// word the formatted body shows a reader appears in the plain text, every word of the plain text
// comes from the formatted body (its visible text, or a link address it carries), and every link
// address in the formatted body is written out in the plain text. Words are compared without
// regard to case, since a rendering may set headings in capitals.

// email.configured_sender_address in spec/contract/observables.yaml.
const serviceAddress = "donotreply@example.test";

const settle = { timeout: 30000 };
const reader = seed.users.vendorOne;

type Mail = {
  clear(): Promise<void>;
  messagesTo(address: string): Promise<Array<{ ID: string; Subject: string }>>;
};

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const complete = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "A full description of the work to be done.",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  reward: 5000,
  skills: ["Backend Development"],
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
  startDate: inDays(28),
  completionDate: inDays(90),
};

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
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/gi, "&");
}

// What a reader of the formatted body is shown: its text, without markup, head or styles.
function shownText(html: string): string {
  return decode(html.replace(/<(head|style|script|title)\b[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " "));
}

function wordsOf(text: string): Set<string> {
  return new Set(text.toLowerCase().match(/[a-z]{3,}/g) ?? []);
}

function linkAddresses(html: string): string[] {
  return [...html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)]
    .map((match) => decode(match[1]).trim())
    .filter((href) => href && !href.startsWith("#"));
}

async function onePerKind(mail: Mail): Promise<Map<string, string>> {
  const bySubject = new Map<string, string>();
  const found = [...(await mail.messagesTo(reader.email)), ...(await mail.messagesTo(serviceAddress))];
  for (const message of found) if (!bySubject.has(message.Subject)) bySubject.set(message.Subject, message.ID);
  return bySubject;
}

async function sendThreeKinds(surface: Surface, mail: Mail): Promise<Map<string, string>> {
  await mail.clear();

  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  await surface.organizationEdit.addTeamMembers({ emails: [reader.email] });
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title: "R-6.5 opportunity whose announcement is read as plain text" });

  await surface.notificationTermsBroadcast.open();
  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  await surface.notificationTermsBroadcast.confirmNotifyVendors();

  await expect.poll(async () => (await onePerKind(mail)).size, settle).toBeGreaterThanOrEqual(3);
  return onePerKind(mail);
}

test("Every message is sent in both a formatted and a plain-text form, the plain text being a rendering of the formatted version rather than separately written copy.", async ({
  surface,
  mail,
}) => {
  test.slow();
  const messages = await sendThreeKinds(surface, mail);

  for (const [listedSubject, messageId] of messages) {
    await surface.caughtMessage.open({ messageId });
    const html = await readOrEmpty(() => surface.caughtMessage.htmlBody());
    const plain = await readOrEmpty(() => surface.caughtMessage.plainTextBody());

    expect.soft(html.trim(), `"${listedSubject}" has a formatted form`).toBeTruthy();
    expect.soft(plain.trim(), `"${listedSubject}" has a plain-text form`).toBeTruthy();

    const plainWords = wordsOf(decode(plain));
    const shownWords = wordsOf(shownText(html));
    const everyWordInHtml = wordsOf(decode(html));

    const missingFromPlain = [...shownWords].filter((word) => !plainWords.has(word));
    const writtenOnlyInPlain = [...plainWords].filter((word) => !everyWordInHtml.has(word));
    const linksMissingFromPlain = linkAddresses(html).filter((href) => !decode(plain).includes(href));

    expect.soft(missingFromPlain, `words of "${listedSubject}" shown formatted but absent from its plain text`).toEqual([]);
    expect.soft(writtenOnlyInPlain, `words of "${listedSubject}" written in its plain text but nowhere in the formatted`).toEqual([]);
    expect.soft(linksMissingFromPlain, `links of "${listedSubject}" not carried into its plain text`).toEqual([]);
  }
});
