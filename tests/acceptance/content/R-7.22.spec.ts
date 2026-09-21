// criterion: @R-7.22 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-21
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const statement = "No two pages may share an address, whether the clash arises on creating a page or on renaming one";

// The criterion's example address is "about". The address taken here is the seeded ordinary
// page's instead: the rule is the same for any address, and the seeded page is a record the
// test can establish is there, where a page the installation is meant to carry may not be.
//
// Both halves establish that the clashing submission was actually put forward before any
// refusal is read. A screen that sits exactly as it was filled in has not exercised the rule
// at all, so each half first waits for the screen to answer its submission in some way —
// with a created page, with a published change, or with a report — and only then reads that
// answer against the address field, where the address was entered. Saying nothing is not the
// same as reporting the address as already in use.
const settle = { timeout: 15000 };
const taken = seed.content.ordinaryPage;
const intruding = "Wording that should never reach a reader.";

async function putCreationForward(surface: Surface): Promise<void> {
  try {
    await surface.contentCreate.publishPage();
  } catch {
    // A form that withholds publishing has not put the page forward; the wait below says so.
  }
  try {
    if (await surface.contentCreate.publishConfirmation()) await surface.contentCreate.confirmPublish();
  } catch {
    // No confirmation was asked for, so there was nothing to confirm.
  }
}

async function putChangeForward(surface: Surface): Promise<void> {
  try {
    await surface.contentEdit.publishChanges();
  } catch {
    // As above: a change that cannot be submitted is not one this test can read a refusal of.
  }
  try {
    await surface.contentEdit.confirmPublishChanges();
  } catch {
    // No confirmation was asked for.
  }
}

// What the create screen has said about the submission, if it has said anything at all: a
// page created, an address reported as taken, or a mark against a field.
const answerToCreation = (surface: Surface) => async () =>
  (await surface.contentCreate.publishedSuccess()) ||
  (await surface.contentCreate.duplicateSlugError()) ||
  (await surface.contentCreate.fieldError());

const answerToChange = (surface: Surface) => async () =>
  (await surface.contentEdit.changesPublishedSuccess()) ||
  (await surface.contentEdit.duplicateSlugError()) ||
  (await surface.contentEdit.fieldError());

test(`${statement} — on creating a page`, async ({ surface }) => {
  await surface.signIn(persona.administrator);

  // Given: a page is already published at the address.
  await surface.contentView.open({ slug: taken.slug });
  await expect
    .poll(() => surface.contentView.pageTitle(), { message: "given: a page is already published at the address", ...settle })
    .toBe(taken.title);
  const existingBody = await surface.contentView.pageBody();

  // When: an administrator creates another page at that address.
  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title: "A second page claiming a taken address" });
  await surface.contentCreate.enterBody({ body: intruding });
  await surface.contentCreate.enterSlug({ slug: taken.slug });

  // The address went in where it is entered: the screen says this is the address the page
  // would stand at.
  await expect
    .poll(() => surface.contentCreate.resultingPublicAddress(), {
      message: "the taken address is what was entered in the address field",
      ...settle,
    })
    .toContain(taken.slug);

  await putCreationForward(surface);

  // The submission was actually put forward: the screen has answered it one way or another.
  await expect
    .poll(answerToCreation(surface), { message: "the creation was submitted and the screen answered it", ...settle })
    .toBeTruthy();

  // Then: it is not accepted, and the address is reported as already in use, against the
  // address field where it was entered.
  expect(await surface.contentCreate.publishedSuccess(), "no second page was created at the taken address").toBeFalsy();
  const reportedAtTheAddressField =
    (await surface.contentCreate.duplicateSlugError()) || (await surface.contentCreate.fieldError());
  expect(reportedAtTheAddressField, "the address is reported as already in use").toBeTruthy();

  // And the existing page is untouched.
  await surface.contentView.open({ slug: taken.slug });
  await expect.poll(() => surface.contentView.pageTitle(), settle).toBe(taken.title);
  expect(await surface.contentView.pageBody(), "the existing page keeps its wording").toBe(existingBody);
  expect(await surface.contentView.pageBody()).not.toContain(intruding);
});

test(`${statement} — on renaming one`, async ({ surface }) => {
  const other = `derived-rename-clash-${Date.now().toString(36)}`;
  const otherTitle = "A page that will try to take a taken address";

  await surface.signIn(persona.administrator);

  // Given: a page is already published at the address.
  await surface.contentView.open({ slug: taken.slug });
  await expect
    .poll(() => surface.contentView.pageTitle(), { message: "given: a page is already published at the address", ...settle })
    .toBe(taken.title);
  const existingBody = await surface.contentView.pageBody();

  // Given: a different page, published at an address of its own, to do the renaming.
  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title: otherTitle });
  await surface.contentCreate.enterBody({ body: "Wording belonging to the page doing the renaming." });
  await surface.contentCreate.enterSlug({ slug: other });
  await putCreationForward(surface);

  await surface.contentView.open({ slug: other });
  await expect
    .poll(() => surface.contentView.pageTitle(), { message: "given: a different page stands at its own address", ...settle })
    .toBe(otherTitle);

  // When: that page is renamed to the taken address.
  await surface.contentEdit.open({ slug: other });
  await expect
    .poll(() => surface.contentEdit.pageAddress(), { message: "given: its managing screen is open", ...settle })
    .toContain(other);
  await surface.contentEdit.startEditing();
  await surface.contentEdit.editSlug({ slug: taken.slug });
  await putChangeForward(surface);

  // The rename was actually put forward: the screen has answered it one way or another.
  await expect
    .poll(answerToChange(surface), { message: "the rename was submitted and the screen answered it", ...settle })
    .toBeTruthy();

  // Then: it is not accepted, and the address is reported as already in use, against the
  // address field where it was entered.
  const reportedAtTheAddressField =
    (await surface.contentEdit.duplicateSlugError()) || (await surface.contentEdit.fieldError());
  expect(reportedAtTheAddressField, "the address is reported as already in use").toBeTruthy();

  // And the existing page is untouched.
  await surface.contentView.open({ slug: taken.slug });
  await expect.poll(() => surface.contentView.pageTitle(), settle).toBe(taken.title);
  expect(await surface.contentView.pageBody(), "the existing page keeps its wording").toBe(existingBody);

  // The page that tried to move is still where it was.
  await surface.contentView.open({ slug: other });
  await expect.poll(() => surface.contentView.pageTitle(), settle).toBe(otherTitle);
});
