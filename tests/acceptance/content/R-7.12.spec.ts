// criterion: @R-7.12 v1
// provenance: blind, spec@2d9a83e439479b419845aa46aa7d9d819b38de24, derived 2026-09-15
import { test, expect, persona } from "../../fixtures";

// The pages the service creates for itself carry no seed handle — the seed records that
// they arrive with the installation rather than with the seed — so they are named by the
// addresses the criterion gives them: the seven service-wide pages, its own example among
// them. The program pages the criterion counts are not named by address anywhere in the
// spec, so they are not guessed at. The harness puts the target back to its seed before
// each test and the seed writes none of these, so each is as the installation left it.
//
// Before a page is read, the installation is established to carry it as a page the
// service needs: a target that holds none of them has not met the given, and its reading
// would say nothing about the criterion.
//
// The count of twenty-two is not asserted: no observation of the list returns how many
// pages it names, and the seed adds an ordinary page of its own besides.
const serviceWide = [
  "about",
  "accessibility",
  "copyright",
  "disclaimer",
  "privacy",
  "markdown-guide",
  "terms-and-conditions",
] as const;

test("A fresh installation carries a full set of the pages the service needs, each holding placeholder text and titled by its own address until somebody writes it — a visitor reading one", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  for (const address of serviceWide) {
    await surface.contentEdit.open({ slug: address });
    await expect
      .poll(() => surface.contentEdit.fixedPageWarning(), {
        message: `given: this installation carries "${address}" as a page the service needs`,
      })
      .toBeTruthy();
  }
  await surface.signOut();

  for (const address of serviceWide) {
    await surface.contentView.open({ slug: address });
    await expect.poll(() => surface.contentView.pageTitle(), { message: `"${address}" answers` }).toBeTruthy();
    expect.soft(await surface.contentView.notFoundForUnknownAddress(), `"${address}" answers`).toBeFalsy();
    expect.soft(await surface.contentView.pageTitle(), `"${address}" is titled by its own address`).toBe(address);
    expect.soft(await surface.contentView.pageBody(), `"${address}" holds placeholder text`).toContain("Initial version");
  }
});

test("A fresh installation carries a full set of the pages the service needs, each holding placeholder text and titled by its own address until somebody writes it — an administrator looking at the list of pages", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.contentEdit.open({ slug: serviceWide[0] });
  await expect
    .poll(() => surface.contentEdit.fixedPageWarning(), {
      message: "given: this installation carries the pages the service needs",
    })
    .toBeTruthy();

  await surface.contentList.open();
  await expect.poll(() => surface.contentList.pageTitle(), { message: "the list of pages is shown" }).toBeTruthy();

  const addresses = await surface.contentList.pagePublicAddress();
  for (const address of serviceWide) {
    expect.soft(addresses, `"${address}" is listed`).toContain(address);
  }
  expect(await surface.contentList.pageIsFixed(), "the listed pages are marked as needed by the service").toBeTruthy();
});
