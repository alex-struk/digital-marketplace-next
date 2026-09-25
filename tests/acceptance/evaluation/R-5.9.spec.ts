// criterion: @R-5.9 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";

// The opportunity is a Sprint With Us draft made by the public sector employee persona, so its
// panel may still be changed. The chairless panel — two public sector members, both evaluators,
// neither marked chair — goes to the service through evaluation-panel-request, which the browser
// form would never send, so a refusal read there is the service's own and not the form's.
//
// "Reject" is read as two things together: the service answers with a refusal, whatever its
// wording, and the panel it holds afterwards is the one it held before the submission.

const settle = { timeout: 15000 };
const members = [seed.users.staffOne, seed.users.staffTwo];

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

test("The service must reject an evaluation panel that names no chair, applying the same rule the browser form already applies, so that no opportunity can enter consensus with nobody able to record the agreed score", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({ title: "R-5.9 opportunity offered a panel with no chair" });
  await expect.poll(() => readOrEmpty(() => surface.opportunitySwuEdit.opportunityIdentifier()), settle).toBeTruthy();
  const opportunityId = await surface.opportunitySwuEdit.opportunityIdentifier();

  const request = surface.evaluationPanelRequest;
  await request.open({ program: "sprint-with-us", opportunityId });
  const before = await readOrEmpty(() => request.panelAsStored());

  try {
    await request.submitPanelWithNoChair({ members });
  } catch {
    // Read below what the service answered.
  }

  await expect.poll(() => readOrEmpty(() => request.missingChairError()), settle).toBeTruthy();

  await request.open({ program: "sprint-with-us", opportunityId });
  expect(await readOrEmpty(() => request.panelAsStored())).toBe(before);
});
