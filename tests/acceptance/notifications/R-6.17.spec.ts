// criterion: @R-6.17 v1
// provenance: blind, spec@76d9da180ae1fba4b970cd40bf8a0a55a680eb3e, derived 2026-10-02
import { test, expect, persona, seed } from "../../fixtures";
import type { Persona, Surface } from "../../fixtures";

// The given is a published opportunity watched by two vendors, one of whom then has their
// account deactivated. The seed's published Code With Us opportunity is used: the target is put
// back to the seed before every test, so it starts watched by nobody. users.vendorOne and
// users.proponentTwo each ask to watch it while still able to sign in, and an administrator then
// deactivates users.vendorOne. users.proponentTwo stays active, so that the notice reaching them
// proves the catcher is reachable and the change did send a notice; absence for the deactivated
// account is then evidence of what the service decided.
//
// The when is the watched opportunity being changed or given an addendum; each is its own test.
//
// Only messages about the opportunity are judged: a message is about it when its subject or
// either of its bodies names the opportunity's title. Deactivating (and reactivating) an account
// sends that account a notice of its own, which can reach the catcher after the screen has
// answered and so after any clearing of the catcher; it does not name the opportunity, so it is
// never counted here, whenever it lands. Among the messages about the opportunity, the
// deactivated account must appear on none — neither as a visible recipient nor as a blind copy
// (a notice to a group is addressed to the service's own address with everyone else
// blind-copied, spec/contract/observables.yaml, email.notes).
//
// "Of any kind" is also judged on a second kind of message: the announcement of a newly published
// Code With Us opportunity, which reaches every account that has asked for new-opportunity
// notices and is not deactivated (email.received_by_an_active_vendor in
// spec/contract/observables.yaml). users.vendorDeactivated has asked for them and is already
// deactivated in the seed, so that test deactivates nobody and no deactivation notice is in play;
// users.vendorOne has asked for them and is active, so its being reached proves the announcement
// was sent and the catcher was reachable.
//
// The watch being retained is observed the way a watch shows itself to its holder: once the
// account is reactivated, the next change to the opportunity reaches it again, although nobody
// asked to watch it in between (a deactivated account cannot sign in to ask).

const statement =
  "A deactivated account receives no notification of any kind, including notices about opportunities it was watching, while the watch itself is retained so that reactivating the account restores it.";

// email.configured_sender_address in spec/contract/observables.yaml.
const serviceAddress = "donotreply@example.test";

const settle = { timeout: 30000 };
const opportunity = seed.opportunities.publishedCodeWithUs;
const opportunityId = opportunity.id;
const deactivated = seed.users.vendorOne;
const activeWatcher = seed.users.proponentTwo;

type Mail = { messagesTo(address: string): Promise<Array<{ ID: string }>>; clear(): Promise<void> };

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

function identifiersIn(listing: string): string[] {
  try {
    const parsed = JSON.parse(listing);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // Not JSON; read as a plain list below.
  }
  return listing
    .split(/[\s,;[\]"']+/)
    .map((id) => id.trim())
    .filter(Boolean);
}

// Every recipient, visible or blind-copied, of every caught message that is about the opportunity.
async function recipientsOfNoticesAboutTheOpportunity(surface: Surface, mail: Mail): Promise<string> {
  const ids = new Set<string>();
  await surface.caughtMessageList.open();
  for (const id of identifiersIn(await readOrEmpty(() => surface.caughtMessageList.messageIdentifiers()))) ids.add(id);
  for (const address of [serviceAddress, deactivated.email, activeWatcher.email]) {
    for (const { ID } of await mail.messagesTo(address)) ids.add(ID);
  }
  const title = opportunity.title.toLowerCase();
  const recipients: string[] = [];
  for (const messageId of ids) {
    await surface.caughtMessage.open({ messageId });
    const said = [
      await readOrEmpty(() => surface.caughtMessage.subject()),
      await readOrEmpty(() => surface.caughtMessage.plainTextBody()),
      await readOrEmpty(() => surface.caughtMessage.htmlBody()),
    ]
      .join(" ")
      .toLowerCase();
    if (!said.includes(title)) continue;
    recipients.push(await readOrEmpty(() => surface.caughtMessage.visibleRecipients()));
    recipients.push(await readOrEmpty(() => surface.caughtMessage.copiedRecipients()));
  }
  return recipients.join(" ").toLowerCase();
}

// Every recipient, visible or blind-copied, of every caught new-opportunity announcement.
const announcementSubject = "A New Code With Us Opportunity Has Been Posted".toLowerCase();
async function recipientsOfAnnouncements(surface: Surface, mail: Mail): Promise<string> {
  const ids = new Set<string>();
  await surface.caughtMessageList.open();
  for (const id of identifiersIn(await readOrEmpty(() => surface.caughtMessageList.messageIdentifiers()))) ids.add(id);
  for (const address of [serviceAddress, seed.users.vendorOne.email, seed.users.vendorDeactivated.email]) {
    for (const { ID } of await mail.messagesTo(address)) ids.add(ID);
  }
  const recipients: string[] = [];
  for (const messageId of ids) {
    await surface.caughtMessage.open({ messageId });
    const subject = (await readOrEmpty(() => surface.caughtMessage.subject())).toLowerCase();
    if (!subject.includes(announcementSubject)) continue;
    recipients.push(await readOrEmpty(() => surface.caughtMessage.visibleRecipients()));
    recipients.push(await readOrEmpty(() => surface.caughtMessage.copiedRecipients()));
  }
  return recipients.join(" ").toLowerCase();
}

async function watch(surface: Surface, who: Persona): Promise<void> {
  await surface.signIn(who);
  await surface.opportunityWatchRequest.open({ program: "code-with-us" });
  await surface.opportunityWatchRequest.watchByRequest({ opportunityId });
  await surface.signOut();
}

// Both vendors watch the opportunity, then an administrator deactivates one of them; leaves the
// administrator signed in.
async function arrangeGiven(surface: Surface): Promise<void> {
  await watch(surface, persona.vendor);
  await watch(surface, persona.competingVendor);

  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: deactivated.id });
  await surface.userProfile.deactivateAccount();
  await surface.userProfile.confirmActivationChange();
}

async function changeOpportunity(surface: Surface, how: "edit" | "addendum", note: string): Promise<void> {
  await surface.opportunityCwuEdit.open({ opportunityId });
  if (how === "edit") {
    await surface.opportunityCwuEdit.editDetails({ description: `R-6.17 the description as changed ${note}.` });
  } else {
    await surface.opportunityCwuEdit.addAddendum({ text: `R-6.17 an addendum added ${note}.` });
  }
}

async function expectOnlyActiveWatcherReached(surface: Surface, mail: Mail): Promise<void> {
  await expect
    .poll(
      async () =>
        (await recipientsOfNoticesAboutTheOpportunity(surface, mail)).includes(activeWatcher.email.toLowerCase()),
      { ...settle, message: "the active watcher is notified of the change" },
    )
    .toBe(true);
  expect(
    (await recipientsOfNoticesAboutTheOpportunity(surface, mail)).includes(deactivated.email.toLowerCase()),
    "the deactivated watcher is among the recipients, visible or blind-copied, of a notice about the opportunity",
  ).toBe(false);
}

test(`${statement} — the watched opportunity is changed`, async ({ surface, mail }) => {
  test.slow();
  await arrangeGiven(surface);

  await mail.clear();
  await changeOpportunity(surface, "edit", "while one watcher is deactivated");

  await expectOnlyActiveWatcherReached(surface, mail);
});

test(`${statement} — the watched opportunity is given an addendum`, async ({ surface, mail }) => {
  test.slow();
  await arrangeGiven(surface);

  await mail.clear();
  await changeOpportunity(surface, "addendum", "while one watcher is deactivated");

  await expectOnlyActiveWatcherReached(surface, mail);
});

test(`${statement} — reactivating the account restores the watch`, async ({ surface, mail }) => {
  test.slow();
  await arrangeGiven(surface);

  await mail.clear();
  await changeOpportunity(surface, "edit", "while one watcher is deactivated");
  await expectOnlyActiveWatcherReached(surface, mail);

  await surface.userProfile.open({ userId: deactivated.id });
  await surface.userProfile.reactivateAccount();
  await surface.userProfile.confirmActivationChange();

  await mail.clear();
  await changeOpportunity(surface, "addendum", "after the watcher was reactivated");

  await expect
    .poll(
      async () =>
        (await recipientsOfNoticesAboutTheOpportunity(surface, mail)).includes(deactivated.email.toLowerCase()),
      { ...settle, message: "the reactivated watcher is notified of the opportunity again without having asked to watch" },
    )
    .toBe(true);
});

test(`${statement} — a new opportunity is announced`, async ({ surface, mail }) => {
  test.slow();
  await surface.signIn(persona.administrator);

  await mail.clear();
  await surface.opportunityCwuEdit.open({ opportunityId: seed.opportunities.draftOfOtherStaff.id });
  await surface.opportunityCwuEdit.publish();

  await expect
    .poll(
      async () => (await recipientsOfAnnouncements(surface, mail)).includes(seed.users.vendorOne.email.toLowerCase()),
      { ...settle, message: "the active vendor who asked for new-opportunity notices is sent the announcement" },
    )
    .toBe(true);
  expect(
    (await recipientsOfAnnouncements(surface, mail)).includes(seed.users.vendorDeactivated.email.toLowerCase()),
    "the deactivated account is among the recipients, visible or blind-copied, of the new-opportunity announcement",
  ).toBe(false);
});
