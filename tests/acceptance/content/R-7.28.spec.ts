// criterion: @R-7.28 v2
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";

// The page is changed "by another administrator since it was opened" the way content-request
// documents: content-edit is opened and editing started, so the screen holds the wording it
// read; the same page is then changed by request, which leaves the screen where it is; and the
// screen then publishes over it. The service carries no record of the version a change was
// based on, so which account sent the intervening change does not decide the outcome, and on
// the oracle it comes from the same administrator sign-in.
//
// The collision clause — two publishes interleaving inside one read-then-write window — is not
// asserted here; see tests/acceptance/not-testable.yaml.
const record = seed.content.ordinaryPage;
const stamp = Date.now().toString(36);
const othersWording = `Wording another administrator published meanwhile (${stamp}).`;
const staleWording = `Wording published from a screen opened before that change (${stamp}).`;

test("an administrator who publishes over a page another has changed since it was opened silently replaces that wording and is told the change was published", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.contentEdit.open({ slug: record.slug });
  await surface.contentEdit.startEditing();
  expect(await surface.contentEdit.bodyBeingEdited()).not.toContain(othersWording);

  await surface.contentRequest.open({ slug: record.slug });
  await surface.contentRequest.changePageByRequest({ title: record.title, body: othersWording });
  expect(await surface.contentRequest.requestAccepted()).toBeTruthy();

  await surface.contentEdit.editBody({ body: staleWording });
  await surface.contentEdit.publishChanges();
  await surface.contentEdit.confirmPublishChanges();
  expect(await surface.contentEdit.changesPublishedSuccess()).toBeTruthy();

  await surface.contentView.open({ slug: record.slug });
  const shown = await surface.contentView.pageBody();
  expect(shown).toContain(staleWording);
  expect(shown).not.toContain(othersWording);
});
