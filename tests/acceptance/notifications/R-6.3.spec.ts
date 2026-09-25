// criterion: @R-6.3 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The oracle is the environment marked for testing (spec/contract/observables.yaml,
// email.test_marker), and a rebuilt target under test is configured the same way.
//
// "Every message" is sampled by three messages of different kinds, each triggered by a
// different part of the service: an invitation to join an organization (to one person), the
// announcement of a newly published opportunity (a batch of blind copies addressed visibly to
// the service's own address), and the announcement of changed terms (to every active vendor).
// The catcher is emptied first, and one message of each distinct subject is read whole through
// caught-message by the catcher's own identifier.

// email.test_marker in spec/contract/observables.yaml.
const testSubjectPrefix = "[TEST] ";
const testLogoEnding = "images/logo_test.png";
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

// One message identifier per distinct subject among what reached the reader and the service's
// own address.
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
  await surface.opportunityCwuCreate.publish({ ...complete, title: "R-6.3 opportunity announced from a test environment" });

  await surface.notificationTermsBroadcast.open();
  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  await surface.notificationTermsBroadcast.confirmNotifyVendors();

  await expect.poll(async () => (await onePerKind(mail)).size, settle).toBeGreaterThanOrEqual(3);
  return onePerKind(mail);
}

test("When an environment is marked as a test environment, every message it sends is marked as a test in its subject line and carries a test variant of the service's logo.", async ({
  surface,
  mail,
}) => {
  test.slow();
  const messages = await sendThreeKinds(surface, mail);

  for (const [listedSubject, messageId] of messages) {
    await surface.caughtMessage.open({ messageId });
    const subject = await readOrEmpty(() => surface.caughtMessage.subject());
    const logo = await readOrEmpty(() => surface.caughtMessage.logoAddress());

    expect.soft(subject.startsWith(testSubjectPrefix), `subject "${subject}" begins with the test marker`).toBe(true);
    expect.soft(logo.trim().endsWith(testLogoEnding), `logo "${logo}" of "${listedSubject}" is the test variant`).toBe(true);
  }
});
