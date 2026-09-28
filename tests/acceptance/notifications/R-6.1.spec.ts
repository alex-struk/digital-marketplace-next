// criterion: @R-6.1 v1
// provenance: blind, spec@c1e09955fdff55e84870c25dfcb8e0fd9981c437, derived 2026-09-28
import { test, expect, persona } from "../../fixtures";

// The given — a service started with notifications switched off — is the configuration
// spec/contract/observables.yaml names configurations.notifications_disabled. It is read once at
// start-up, so no test can put a running service into it; this test is written for, and must be
// run against, an instance started that way. It does not skip itself on any signal from the
// environment: run against an instance with notifications on, it fails, because the message it
// says must not be sent is sent. The tag names the configuration so a runner can pick this test
// out for the instance started for it.
//
// The action is the one observables.yaml names for this configuration: an administrator
// publishing a Code With Us opportunity, which under the default announces it to every account
// that asked for new-opportunity notices. It must complete and report success as it would with
// notifications on; then, after a margin longer than a message takes to reach the catcher under
// the default, the catcher must hold nothing at all.

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

test(
  "When notifications are switched off for an environment, nothing the service does sends a message, and every action that would have sent one still completes normally.",
  { tag: "@notifications_disabled" },
  async ({ surface, mail }) => {
    test.slow();
    await mail.clear();

    await surface.signIn(persona.administrator);

    // The action completes and reports success.
    await surface.opportunityCwuCreate.open();
    await surface.opportunityCwuCreate.publish({ ...complete, title });
    expect(await readOrEmpty(() => surface.opportunityCwuCreate.fieldError())).toBeFalsy();
    await expect.poll(() => readOrEmpty(() => surface.opportunityCwuEdit.opportunityIdentifier()), settle).toBeTruthy();
    const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
    await surface.opportunityCwuView.open({ opportunityId });
    expect((await readOrEmpty(() => surface.opportunityCwuView.status())).toLowerCase()).toMatch(/publish/);

    // Under the default these announcements reach the catcher within seconds; allow a generous
    // margin, then nothing may have arrived for anybody.
    await new Promise((resolve) => setTimeout(resolve, 10000));
    await surface.caughtMessageList.open();
    expect(Number(await surface.caughtMessageList.messageCount()), "messages sent with notifications switched off").toBe(0);
  },
);
