// criterion: @R-1.35 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";

// The seeded published opportunity's author is a member of public sector staff and the
// change is made by an administrator, so the author's notice can be told from the mail of
// the person who made the change.
//
// The watchers and the proponents are not asserted. Both are told as a group, in blind
// copies, and the mail fixture searches by visible recipient only, so neither their being
// told nor their not being told can be read. The draft and cancelled cases the criterion
// excludes are unassertable for the same reason.

const opportunityId = seed.opportunities.publishedCodeWithUs.id;

test("changing an opportunity that is neither a draft nor cancelled notifies its author", async ({
  surface,
  mail,
}) => {
  const author = seed.users.staffOne.email;
  const before = (await mail.messagesTo(author)).length;

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.editDetails({
    description: "R-1.35 the description as an administrator changed it.",
  });

  await expect
    .poll(async () => (await mail.messagesTo(author)).length, { timeout: 15000 })
    .toBeGreaterThan(before);
});

test("adding an addendum to an opportunity that is neither a draft nor cancelled notifies its author", async ({
  surface,
  mail,
}) => {
  const author = seed.users.staffOne.email;
  const before = (await mail.messagesTo(author)).length;

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.addAddendum({
    text: "R-1.35 an addendum that ought to notify.",
  });

  await expect
    .poll(async () => (await mail.messagesTo(author)).length, { timeout: 15000 })
    .toBeGreaterThan(before);
});
