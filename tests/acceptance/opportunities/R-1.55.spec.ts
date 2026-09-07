// criterion: @R-1.55 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The panel is named on a Sprint With Us draft of the test's own, and each test offers a
// panel that is wrong in exactly one way. The reason named is read from the observation
// that matches the fault, so a refusal for some other reason would not satisfy it.
//
// The fifth fault the criterion lists — more than one chair — is not asserted: the panel
// surface names errors for too few members, a duplicate member, a missing chair and a
// member who is not a public sector employee, but none that names a second chair. The
// criterion requires the reason to be named, and no observation here reads that reason,
// so a refusal for a second chair could not be told from a refusal for anything else.

async function sprintDraft(surface: Surface, title: string): Promise<void> {
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({ title });
  await surface.evaluationPanelSwu.open({ title });
}

test("a Sprint With Us opportunity's evaluation panel is rejected with fewer than two members", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await sprintDraft(surface, "R-1.55 opportunity whose panel has one member");

  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffOne });
  await surface.evaluationPanelSwu.markMemberAsChair({ member: seed.users.staffOne });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect(await surface.evaluationPanelSwu.minimumMembersError()).toBeTruthy();
});

test("a Sprint With Us opportunity's evaluation panel is rejected when it names the same person twice", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await sprintDraft(surface, "R-1.55 opportunity whose panel names one person twice");

  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffOne });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffOne });
  await surface.evaluationPanelSwu.markMemberAsChair({ member: seed.users.staffOne });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect(await surface.evaluationPanelSwu.duplicateMemberError()).toBeTruthy();
});

test("a Sprint With Us opportunity's evaluation panel is rejected when no member is the chair", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await sprintDraft(surface, "R-1.55 opportunity whose panel has no chair");

  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffOne });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect(await surface.evaluationPanelSwu.missingChairError()).toBeTruthy();
});

test("a Sprint With Us opportunity's evaluation panel is rejected when it names anyone who is not a public sector employee", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await sprintDraft(surface, "R-1.55 opportunity whose panel names a vendor");

  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffOne });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.vendorOne });
  await surface.evaluationPanelSwu.markMemberAsChair({ member: seed.users.staffOne });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect(await surface.evaluationPanelSwu.nonPublicSectorMemberError()).toBeTruthy();
});
