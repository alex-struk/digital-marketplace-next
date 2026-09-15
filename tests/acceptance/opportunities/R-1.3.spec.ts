// criterion: @R-1.3 v1
// provenance: blind, spec@08d8aac0ee7ec7fcee1a309ef183dcb17e38221b, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The criterion wants two members of staff, each holding unpublished work. The target mints a
// session for only one of them, so the second staff member's draft comes from the seed and is
// read as something the first must not see, rather than as something a second session creates.
//
// The criterion is about staff who are not administrators, so before listing anything the
// signed-in staff member's own statement of permissions is read and must not name
// administrator rights. The member of staff holds a draft and an opportunity under review of
// their own, since the criterion names both.

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

async function signInAsStaffWithoutAdministratorRights(surface: Surface): Promise<void> {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfile.open({ userId: seed.users.staffOne.id });
  const permissions = (await surface.userProfile.permissionsLabel()).toLowerCase();
  expect(permissions).toBeTruthy();
  expect(permissions).not.toContain("admin");
}

async function createOwnUnpublishedWork(surface: Surface, draft: string, underReview: string): Promise<void> {
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title: draft });
  expect(await surface.opportunityCwuEdit.opportunityIdentifier()).toBeTruthy();

  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.submitForReview({ ...complete, title: underReview });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  await surface.opportunityCwuView.open({ opportunityId });
  expect((await surface.opportunityCwuView.status()).toLowerCase()).toContain("review");
}

test("a member of public sector staff sees every published opportunity plus their own drafts and opportunities under review", async ({
  surface,
}) => {
  const draft = "R-1.3 draft of the member of staff who is signed in";
  const underReview = "R-1.3 opportunity under review of the member of staff who is signed in";

  await signInAsStaffWithoutAdministratorRights(surface);
  await createOwnUnpublishedWork(surface, draft, underReview);

  await surface.opportunityList.open();
  const unpublished = await surface.opportunityList.unpublishedGroup();
  expect(unpublished).toContain(draft);
  expect(unpublished).toContain(underReview);
  expect(unpublished).not.toContain(seed.opportunities.draftOfOtherStaff.title);
  expect(await surface.opportunityList.openGroup()).toContain(seed.opportunities.publishedCodeWithUs.title);
});

test("an administrator sees every opportunity", async ({ surface }) => {
  const draft = "R-1.3 draft of a member of staff an administrator must see";
  const underReview = "R-1.3 opportunity under review of a member of staff an administrator must see";

  await signInAsStaffWithoutAdministratorRights(surface);
  await createOwnUnpublishedWork(surface, draft, underReview);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityList.open();
  const unpublished = await surface.opportunityList.unpublishedGroup();
  expect(unpublished).toContain(draft);
  expect(unpublished).toContain(underReview);
  expect(unpublished).toContain(seed.opportunities.draftOfOtherStaff.title);
  expect(await surface.opportunityList.openGroup()).toContain(seed.opportunities.publishedCodeWithUs.title);
});
