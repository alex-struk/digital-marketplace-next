// criterion: @R-1.35 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// The seeded published opportunity's author is a member of public sector staff and the
// change is made by an administrator, so the author's notice can be told from the mail of
// the person who made the change.
//
// The watchers and the proponents are not asserted. Both are told as a group, in blind
// copies, and the mail fixture searches by visible recipient only (mail.messagesTo), so
// neither their being told nor their not being told can be read. The draft and cancelled
// cases the criterion excludes are unassertable for the same reason.

test("changing an opportunity that is neither a draft nor cancelled notifies its author", async ({
  surface,
  mail,
}) => {
  const author = seed.users.staffOne.email;
  const before = (await mail.messagesTo(author)).length;

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ id: seed.opportunities.publishedCodeWithUs.id });
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
  await surface.opportunityCwuEdit.open({ id: seed.opportunities.publishedCodeWithUs.id });
  await surface.opportunityCwuEdit.addAddendum({ text: "R-1.35 an addendum that ought to notify." });

  await expect
    .poll(async () => (await mail.messagesTo(author)).length, { timeout: 15000 })
    .toBeGreaterThan(before);
});
