// criterion: @R-5.1 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-09
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each test gives a Sprint With Us draft of its own a panel that is wrong in exactly one
// way, so a refusal can only be that fault's doing, and reads back the error the panel
// surface names for the rule that was broken rather than any refusal at all.
//
// Two parts of the criterion are left alone. The fault it lists last — two people marked as
// chair — has no observation naming it: the panel surface carries errors for too few
// members, a repeated member, a member who is not a public sector employee and a missing
// chair, and none for a second chair, so a refusal on that account could not be told from a
// refusal on any other. And "the opportunity keeps the panel it had" is not asserted,
// because panel_member_row reports that a panel is shown rather than which people it names,
// so a panel that had wrongly changed would read exactly like one that had not.
//
// Only Sprint With Us is exercised. The two panel surfaces carry the same five actions and
// the same seven observations, and the criterion's own note says the minimum of two members
// is the same in both programs.

async function draftWithPanelForm(surface: Surface, title: string): Promise<void> {
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({ title });
  await surface.evaluationPanelSwu.open({ title });
}

test("an opportunity that uses a panel must name at least two panel members", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await draftWithPanelForm(surface, "R-5.1 opportunity whose panel names one person");

  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.markMemberAsChair({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect(await surface.evaluationPanelSwu.minimumMembersError()).toBeTruthy();
});

test("each panel member must be named only once", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await draftWithPanelForm(surface, "R-5.1 opportunity whose panel names one person twice");

  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.markMemberAsChair({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect(await surface.evaluationPanelSwu.duplicateMemberError()).toBeTruthy();
});

test("each panel member must be a public sector employee", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await draftWithPanelForm(surface, "R-5.1 opportunity whose panel names a vendor");

  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.vendorOne });
  await surface.evaluationPanelSwu.markMemberAsChair({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect(await surface.evaluationPanelSwu.nonPublicSectorMemberError()).toBeTruthy();
});
