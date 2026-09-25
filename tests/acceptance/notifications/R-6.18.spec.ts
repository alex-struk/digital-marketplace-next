// criterion: @R-6.18 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";

// An administrator announces changed terms from the terms and conditions page, and the message
// that reaches an active vendor (users.vendorOne) is read whole through caught-message. Both its
// forms are read, and each is held to naming all three programs or none of them.

const recipient = seed.users.vendorOne;
const programs = ["Code With Us", "Sprint With Us", "Team With Us"];
const settle = { timeout: 30000 };

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

function shownText(html: string): string {
  return html
    .replace(/<(head|style|script|title)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ");
}

function programsNamed(text: string): string[] {
  const flat = text.replace(/\s+/g, " ").toLowerCase();
  return programs.filter((program) => flat.includes(program.toLowerCase()));
}

test("The message announcing changed terms names every program whose proposals require a current acceptance — Code With Us, Sprint With Us and Team With Us — or names none of them rather than a subset.", async ({
  surface,
  mail,
}) => {
  await mail.clear();
  await surface.signIn(persona.administrator);
  await surface.notificationTermsBroadcast.open();
  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  await surface.notificationTermsBroadcast.confirmNotifyVendors();

  await expect.poll(async () => (await mail.messagesTo(recipient.email)).length, settle).toBeGreaterThan(0);
  const [message] = await mail.messagesTo(recipient.email);

  await surface.caughtMessage.open({ messageId: message.ID });
  const html = await readOrEmpty(() => surface.caughtMessage.htmlBody());
  const plain = await readOrEmpty(() => surface.caughtMessage.plainTextBody());
  expect(`${html}${plain}`.trim(), "the message has a body").toBeTruthy();

  for (const [form, text] of [
    ["formatted", shownText(html)],
    ["plain-text", plain],
  ] as const) {
    const named = programsNamed(text);
    expect.soft([0, programs.length], `programs named in the ${form} form: ${named.join(", ") || "none"}`).toContain(named.length);
  }
});
