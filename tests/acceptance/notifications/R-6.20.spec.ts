// criterion: @R-6.20 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// persona.firstTimeVendor is an identity the sandbox identity provider carries and the seed does
// not, so signing in as it creates the account this criterion is about. (The oracle has no
// identity provider, so this persona cannot sign in there; the test is for the rebuilt target.)
// The person finishes their profile without touching the new-opportunity choice, which is what
// "until its holder asks" leaves them having done.
//
// "Records no request" is read off the person's own notification settings, compared with how
// the same control reads for persona.vendorWithNoticesOff, whom the seed holds with notices off.
//
// "None is sent to them" is read from the announcement of a newly published opportunity, which
// goes out as batches of blind copies addressed visibly to the service's own address: every batch
// is read whole until between them they have reached every one of seed.subscribers, and the new
// account's address must be on none of them.

// email.configured_sender_address in spec/contract/observables.yaml.
const serviceAddress = "donotreply@example.test";

const settle = { timeout: 60000, intervals: [1000, 2000, 5000] };
const subscribers = Array.from({ length: seed.subscribers.group.count }, (_, i) =>
  seed.subscribers.group.email_pattern.replace("NNN", String(i + 1).padStart(3, "0")).toLowerCase(),
);

type Mail = {
  clear(): Promise<void>;
  messagesTo(address: string): Promise<Array<{ ID: string }>>;
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

function addressesIn(text: string): string[] {
  return [...new Set(text.toLowerCase().match(/[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/g) ?? [])];
}

async function everyoneAnnouncedTo(surface: Surface, mail: Mail): Promise<Set<string>> {
  const reached = new Set<string>();
  for (const { ID } of await mail.messagesTo(serviceAddress)) {
    await surface.caughtMessage.open({ messageId: ID });
    for (const address of addressesIn(await readOrEmpty(() => surface.caughtMessage.visibleRecipients()))) reached.add(address);
    for (const address of addressesIn(await readOrEmpty(() => surface.caughtMessage.copiedRecipients()))) reached.add(address);
  }
  return reached;
}

test("A newly created account has new-opportunity notifications off until its holder asks for them.", async ({
  surface,
  mail,
}) => {
  test.slow();

  await surface.signIn(persona.vendorWithNoticesOff);
  await surface.userProfileSelfNotifications.open();
  const off = await surface.userProfileSelfNotifications.newOpportunitiesCheckbox();
  expect(off, "how the control reads for an account with notices off").toBeTruthy();
  await surface.signOut();

  await surface.signIn(persona.firstTimeVendor);
  await surface.userSignUpComplete.open();
  await surface.userSignUpComplete.acceptAppTerms();
  await surface.userSignUpComplete.completeProfile();

  await surface.userProfileSelfNotifications.open();
  expect(await surface.userProfileSelfNotifications.newOpportunitiesCheckbox()).toBe(off);
  await surface.userProfileSelf.open();
  const address = (await readOrEmpty(() => surface.userProfileSelf.emailField())).trim().toLowerCase();
  expect(address, "the new account's address").toBeTruthy();
  await surface.signOut();

  await mail.clear();
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title: "R-6.20 opportunity announced after a new account is created" });

  await expect
    .poll(async () => {
      const reached = await everyoneAnnouncedTo(surface, mail);
      return subscribers.filter((subscriber) => !reached.has(subscriber)).length;
    }, { ...settle, message: "subscribers the announcement has not yet reached" })
    .toBe(0);
  expect((await everyoneAnnouncedTo(surface, mail)).has(address), "the new account was sent the announcement").toBe(false);
});
