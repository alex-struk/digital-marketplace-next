// criterion: @R-7.20 v1
// provenance: blind, spec@1c3743e9fb53c29de89a28045222abab29c5e27e, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const statement =
  "A page must have a title of between one and a hundred characters and a body of between one and fifty thousand characters, and a submission failing either is refused with the failing field named";

// Every submission is sound but for the one field under test, so a mark on the form can only
// be about that field. The criterion is met by a refusal that comes before the submission as
// much as after it, so an attempt to publish that does not go through is not itself a failure:
// what is checked is the field's mark, given time to appear, and that nothing was saved.
const stamp = Date.now().toString(36);
const acceptableTitle = "A title of an entirely acceptable length";
const acceptableBody = "A body that is perfectly acceptable.";
const settle = { timeout: 15000 };

async function attemptToPublishNewPage(surface: Surface): Promise<void> {
  try {
    await surface.contentCreate.publishPage();
  } catch {
    // A form that withholds publishing from an invalid page has already refused it.
  }
  try {
    if (await surface.contentCreate.publishConfirmation()) await surface.contentCreate.confirmPublish();
  } catch {
    // No confirmation was offered, which is a refusal too.
  }
}

async function attemptToPublishChanges(surface: Surface): Promise<void> {
  try {
    await surface.contentEdit.publishChanges();
  } catch {
    // As above: a withheld publish is a refusal.
  }
  try {
    await surface.contentEdit.confirmPublishChanges();
  } catch {
    // No confirmation was offered.
  }
}

async function expectNoPageAt(surface: Surface, slug: string): Promise<void> {
  await surface.signOut();
  await surface.contentView.open({ slug });
  await expect.poll(() => surface.contentView.notFoundForUnknownAddress(), settle).toBeTruthy();
}

test(`${statement} — creating a page with an empty title`, async ({ surface }) => {
  const slug = `derived-empty-title-${stamp}`;
  await surface.signIn(persona.administrator);

  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title: "" });
  await surface.contentCreate.enterSlug({ slug });
  await surface.contentCreate.enterBody({ body: acceptableBody });
  await attemptToPublishNewPage(surface);

  await expect.poll(() => surface.contentCreate.fieldError(), settle).toBeTruthy();
  await expectNoPageAt(surface, slug);
});

test(`${statement} — creating a page with a body longer than fifty thousand characters`, async ({ surface }) => {
  const slug = `derived-long-body-${stamp}`;
  await surface.signIn(persona.administrator);

  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title: acceptableTitle });
  await surface.contentCreate.enterSlug({ slug });
  await surface.contentCreate.enterBody({ body: "b".repeat(50001) });
  await attemptToPublishNewPage(surface);

  await expect.poll(() => surface.contentCreate.fieldError(), settle).toBeTruthy();
  await expectNoPageAt(surface, slug);
});

test(`${statement} — creating a page with a title longer than a hundred characters`, async ({ surface }) => {
  const slug = `derived-long-title-${stamp}`;
  await surface.signIn(persona.administrator);

  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title: "t".repeat(101) });
  await surface.contentCreate.enterSlug({ slug });
  await surface.contentCreate.enterBody({ body: acceptableBody });
  await attemptToPublishNewPage(surface);

  await expect.poll(() => surface.contentCreate.fieldError(), settle).toBeTruthy();
  await expectNoPageAt(surface, slug);
});

test(`${statement} — creating a page with an empty body`, async ({ surface }) => {
  const slug = `derived-empty-body-${stamp}`;
  await surface.signIn(persona.administrator);

  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title: acceptableTitle });
  await surface.contentCreate.enterSlug({ slug });
  await surface.contentCreate.enterBody({ body: "" });
  await attemptToPublishNewPage(surface);

  await expect.poll(() => surface.contentCreate.fieldError(), settle).toBeTruthy();
  await expectNoPageAt(surface, slug);
});

// Changing a page: the seeded ordinary page is read as a visitor before and after, and what a
// visitor reads must not have moved.
test(`${statement} — changing a page to an empty title`, async ({ surface }) => {
  const ordinaryPage = seed.content.ordinaryPage;
  await surface.contentView.open({ slug: ordinaryPage.slug });
  const titleBefore = await surface.contentView.pageTitle();

  await surface.signIn(persona.administrator);
  await surface.contentEdit.open({ slug: ordinaryPage.slug });
  await surface.contentEdit.startEditing();
  await surface.contentEdit.editTitle({ title: "" });
  await attemptToPublishChanges(surface);

  await expect.poll(() => surface.contentEdit.fieldError(), settle).toBeTruthy();

  await surface.signOut();
  await surface.contentView.open({ slug: ordinaryPage.slug });
  await expect.poll(() => surface.contentView.pageTitle(), settle).toBe(titleBefore);
});

test(`${statement} — changing a page to a body longer than fifty thousand characters`, async ({ surface }) => {
  const ordinaryPage = seed.content.ordinaryPage;
  await surface.contentView.open({ slug: ordinaryPage.slug });
  const bodyBefore = await surface.contentView.pageBody();

  await surface.signIn(persona.administrator);
  await surface.contentEdit.open({ slug: ordinaryPage.slug });
  await surface.contentEdit.startEditing();
  await surface.contentEdit.editBody({ body: "b".repeat(50001) });
  await attemptToPublishChanges(surface);

  await expect.poll(() => surface.contentEdit.fieldError(), settle).toBeTruthy();

  await surface.signOut();
  await surface.contentView.open({ slug: ordinaryPage.slug });
  await expect.poll(() => surface.contentView.pageBody(), settle).toBe(bodyBefore);
});

// The limits are inclusive: a page at the very edge of both is accepted, which is what shows
// the refusals above sit where the criterion puts them.
test(`${statement} — a page with a title of a hundred characters and a body of fifty thousand is accepted`, async ({
  surface,
}) => {
  const slug = `derived-at-limits-${stamp}`;
  const title = "t".repeat(100);
  await surface.signIn(persona.administrator);

  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title });
  await surface.contentCreate.enterSlug({ slug });
  await surface.contentCreate.enterBody({ body: "b".repeat(50000) });
  await attemptToPublishNewPage(surface);

  await surface.signOut();
  await surface.contentView.open({ slug });
  await expect.poll(() => surface.contentView.pageTitle(), settle).toBe(title);
});
