// criterion: @R-7.20 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// Each submission is complete but for the one field under test, so a refusal can only be
// about that field. Afterwards the address is opened as a visitor: nothing was saved.
const emptyTitleAddress = `derived-empty-title-${Date.now().toString(36)}`;
const longBodyAddress = `derived-long-body-${Date.now().toString(36)}`;

test("a page whose title is empty is refused with the failing field named, and nothing is saved", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title: "" });
  await surface.contentCreate.enterSlug({ slug: emptyTitleAddress });
  await surface.contentCreate.enterBody({ body: "A body that is perfectly acceptable." });
  await surface.contentCreate.publishPage();

  expect(await surface.contentCreate.fieldError()).toBeTruthy();

  await surface.signOut();
  await surface.contentView.open({ slug: emptyTitleAddress });
  expect(await surface.contentView.notFoundForUnknownAddress()).toBeTruthy();
});

test("a page whose body is longer than fifty thousand characters is refused with the failing field named, and nothing is saved", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title: "A title of an entirely acceptable length" });
  await surface.contentCreate.enterSlug({ slug: longBodyAddress });
  await surface.contentCreate.enterBody({ body: "b".repeat(50001) });
  await surface.contentCreate.publishPage();

  expect(await surface.contentCreate.fieldError()).toBeTruthy();

  await surface.signOut();
  await surface.contentView.open({ slug: longBodyAddress });
  expect(await surface.contentView.notFoundForUnknownAddress()).toBeTruthy();
});

test("a page whose title is longer than a hundred characters is refused with the failing field named", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title: "t".repeat(101) });
  await surface.contentCreate.enterSlug({ slug: `derived-long-title-${Date.now().toString(36)}` });
  await surface.contentCreate.enterBody({ body: "A body that is perfectly acceptable." });
  await surface.contentCreate.publishPage();

  expect(await surface.contentCreate.fieldError()).toBeTruthy();
});

test("a page whose body is empty is refused with the failing field named", async ({ surface }) => {
  await surface.signIn(persona.administrator);

  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title: "A title of an entirely acceptable length" });
  await surface.contentCreate.enterSlug({ slug: `derived-empty-body-${Date.now().toString(36)}` });
  await surface.contentCreate.enterBody({ body: "" });
  await surface.contentCreate.publishPage();

  expect(await surface.contentCreate.fieldError()).toBeTruthy();
});
