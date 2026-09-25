// criterion: @R-5.18 v2
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";

// Two readings, matching the criterion's two halves.
//
// What the service returns is read through evaluation-panel-request, the service's own answer
// for one opportunity, whose panel_as_stored is the membership that answer carries for the
// signed-in person. The screen that lists and manages the panel is evaluation-panel-swu, and
// whether it opened is read as panel_member_row being there or not.
//
// Every person is reached on a seeded Sprint With Us opportunity where their connection is
// fixed by the seed rather than built:
//   - swuLapsedOwnerOffPanel belongs to users.staffOne (persona.publicSectorStaff), who is not
//     on its panel: the owner;
//   - swuLapsedChairNotEvaluator belongs to users.staffTwo and names users.staffOne as its
//     chair: a panel member who is neither the owner nor an administrator;
//   - swuCodeChallengeOfOtherStaff belongs to users.staffTwo, and users.staffOne has no
//     connection to it at all: the public sector employee who is neither owner nor on the panel.
// The administrator and a vendor are looked with on those same records.
//
// The screen's "Not Found" is not asserted by its wording: the panel screen carries no
// observation of a not-found answer, so its refusal is read as the panel not being shown.

const settle = { timeout: 15000 };
const program = "sprint-with-us";
const ownerOffPanel = seed.opportunities.swuLapsedOwnerOffPanel.id;
const memberNotOwner = seed.opportunities.swuLapsedChairNotEvaluator.id;
const unconnected = seed.opportunities.swuCodeChallengeOfOtherStaff.id;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

test("The membership of an evaluation panel is returned by the service to an administrator, the opportunity's owner and the people on the panel itself", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.administrator);
  await surface.evaluationPanelRequest.open({ program, opportunityId: ownerOffPanel });
  await expect.poll(() => readOrEmpty(() => surface.evaluationPanelRequest.panelAsStored()), settle).toBeTruthy();
  await surface.signOut();

  await surface.signIn(persona.publicSectorStaff);
  await surface.evaluationPanelRequest.open({ program, opportunityId: ownerOffPanel });
  await expect.poll(() => readOrEmpty(() => surface.evaluationPanelRequest.panelAsStored()), settle).toBeTruthy();

  await surface.evaluationPanelRequest.open({ program, opportunityId: memberNotOwner });
  await expect.poll(() => readOrEmpty(() => surface.evaluationPanelRequest.panelAsStored()), settle).toBeTruthy();
});

test("The membership of an evaluation panel is returned by the service to nobody else: not to a vendor, nor to a public sector employee who is neither the owner nor on the panel", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.evaluationPanelRequest.open({ program, opportunityId: unconnected });
  expect(await readOrEmpty(() => surface.evaluationPanelRequest.panelAsStored())).toBeFalsy();
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await surface.evaluationPanelRequest.open({ program, opportunityId: unconnected });
  expect(await readOrEmpty(() => surface.evaluationPanelRequest.panelAsStored())).toBeFalsy();
});

test("The screen that lists and manages the panel opens for an administrator or the opportunity's owner", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.administrator);
  await surface.evaluationPanelSwu.open({ opportunityId: ownerOffPanel });
  await expect.poll(() => readOrEmpty(() => surface.evaluationPanelSwu.panelMemberRow()), settle).toBeTruthy();
  await surface.signOut();

  await surface.signIn(persona.publicSectorStaff);
  await surface.evaluationPanelSwu.open({ opportunityId: ownerOffPanel });
  await expect.poll(() => readOrEmpty(() => surface.evaluationPanelSwu.panelMemberRow()), settle).toBeTruthy();
});

test("The screen that lists and manages the panel answers \"Not Found\" to anyone else who asks for it, a panel member included", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.publicSectorStaff);
  await surface.evaluationPanelSwu.open({ opportunityId: memberNotOwner });
  expect(await readOrEmpty(() => surface.evaluationPanelSwu.panelMemberRow())).toBeFalsy();

  await surface.evaluationPanelSwu.open({ opportunityId: unconnected });
  expect(await readOrEmpty(() => surface.evaluationPanelSwu.panelMemberRow())).toBeFalsy();
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await surface.evaluationPanelSwu.open({ opportunityId: unconnected });
  expect(await readOrEmpty(() => surface.evaluationPanelSwu.panelMemberRow())).toBeFalsy();
});
