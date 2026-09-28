// criterion: @R-6.1 v1
// provenance: blind, spec@f31700e000484947669c48e50cf9c73b4d1e20c7, derived 2026-09-28
import { test, expect, persona } from "../../fixtures";

// The given — a service started with notifications switched off — is the oracle configuration
// observables.yaml names configurations.notifications_disabled. Nothing the service shows says
// which configuration it runs under, so the harness that starts an instance that way exports
// SDLC_ORACLE_DISABLE_NOTIFICATIONS=1 to the test process too. Without it the instance does not
// offer the criterion's given, and the test is skipped rather than failed; every other criterion
// that expects a message is false on such an instance, so it is never shared with them.
//
// Two actions that send under the default configuration are taken: publishing a Code With Us
// opportunity (announced to every account that asked for new-opportunity notices — the seed holds
// many) and announcing changed terms (a message to every active vendor). Each must report success
// as it would with notifications on; then, after a margin longer than a message takes to reach the
// catcher under the default, the catcher must hold nothing at all.

const disabled = process.env.SDLC_ORACLE_DISABLE_NOTIFICATIONS === "1";

const settle = { timeout: 30000 };
const title = "R-6.1 opportunity published with notifications switched off";

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

test("When notifications are switched off for an environment, nothing the service does sends a message, and every action that would have sent one still completes normally.", async ({
  surface,
  mail,
}) => {
  test.skip(!disabled, "this instance was not started with notifications switched off (SDLC_ORACLE_DISABLE_NOTIFICATIONS=1)");
  test.slow();
  await mail.clear();

  await surface.signIn(persona.administrator);

  // Publishing an opportunity completes and reports success.
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title });
  expect(await readOrEmpty(() => surface.opportunityCwuCreate.fieldError())).toBeFalsy();
  await expect.poll(() => readOrEmpty(() => surface.opportunityCwuEdit.opportunityIdentifier()), settle).toBeTruthy();
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  await surface.opportunityCwuView.open({ opportunityId });
  expect((await readOrEmpty(() => surface.opportunityCwuView.status())).toLowerCase()).toMatch(/publish/);

  // Announcing changed terms completes and reports success.
  await surface.notificationTermsBroadcast.open();
  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  await surface.notificationTermsBroadcast.confirmNotifyVendors();
  await expect.poll(() => readOrEmpty(() => surface.notificationTermsBroadcast.notifyVendorsSuccess()), settle).toBeTruthy();
  expect(await readOrEmpty(() => surface.notificationTermsBroadcast.notifyVendorsFailure())).toBeFalsy();

  // Under the default configuration these messages reach the catcher within seconds; allow a
  // generous margin, then nothing may have arrived for anybody.
  await new Promise((resolve) => setTimeout(resolve, 10000));
  await surface.caughtMessageList.open();
  expect(Number(await surface.caughtMessageList.messageCount()), "messages sent with notifications switched off").toBe(0);
});
