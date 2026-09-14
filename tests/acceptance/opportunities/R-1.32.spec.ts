// criterion: @R-1.32 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona } from "../../fixtures";

// The addendum is read back off the opportunity's own view, where the criterion says it is
// appended. The author's addendum and the administrator's are taken separately, because the
// criterion offers the action to both and the two are different people here: the opportunity
// is drafted by a member of staff and published by an administrator.
//
// The closing clause — that an addendum cannot be removed afterwards — is not asserted. The
// surface names no action that removes one, and the absence of an action is not something an
// observation can report.

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

test("an addendum may be added to an opportunity that is no longer a draft by the staff member who created it", async ({
  surface,
}) => {
  const title = "R-1.32 published opportunity its author added an addendum to";
  const addendum = "R-1.32 an addendum the opportunity's own author wrote.";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ ...complete, title });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.publish();
  await surface.signOut();

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.addAddendum({ text: addendum });

  await surface.opportunityCwuView.open({ opportunityId });
  expect(await surface.opportunityCwuView.addenda()).toContain(addendum);
});

test("an addendum may be added to an opportunity that is no longer a draft by an administrator", async ({
  surface,
}) => {
  const title = "R-1.32 published opportunity an administrator added an addendum to";
  const addendum = "R-1.32 an addendum an administrator wrote.";

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();

  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.addAddendum({ text: addendum });

  await surface.opportunityCwuView.open({ opportunityId });
  expect(await surface.opportunityCwuView.addenda()).toContain(addendum);
});

test("an addendum cannot be added to an opportunity that is still a draft", async ({ surface }) => {
  const title = "R-1.32 draft an administrator tried to add an addendum to";
  const addendum = "R-1.32 an addendum offered to a draft.";

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ ...complete, title });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();

  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.addAddendum({ text: addendum });

  await surface.opportunityCwuView.open({ opportunityId });
  expect(await surface.opportunityCwuView.addenda()).not.toContain(addendum);
});

test("an addendum of more than five thousand characters is refused", async ({ surface }) => {
  const title = "R-1.32 published opportunity offered an addendum that runs too long";
  const addendum = "a".repeat(5001);

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();

  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.addAddendum({ text: addendum });

  await surface.opportunityCwuView.open({ opportunityId });
  expect(await surface.opportunityCwuView.addenda()).not.toContain(addendum);
});
