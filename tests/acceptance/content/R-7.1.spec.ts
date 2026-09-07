// criterion: @R-7.1 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, seed } from "../../fixtures";

// No sign-in anywhere in this test: the reader is a visitor with no session at all, which
// is the whole point of the criterion. seed.content.ordinaryPage is the one page the seed
// holds; its current wording carries a formatted word, so a body handed back with the
// formatting marks still in it would not be formatted text.
test("anyone, including a visitor who has not signed in, can read a page by its address and sees its title, its body as formatted text, and the dates it was first published and last updated", async ({
  surface,
}) => {
  await surface.contentView.open({ slug: seed.content.ordinaryPage.slug });

  expect(await surface.contentView.readableWhenSignedOut()).toBeTruthy();
  expect(await surface.contentView.pageTitle()).toBe(seed.content.ordinaryPage.title);

  const body = await surface.contentView.pageBody();
  expect(body).toBeTruthy();
  expect(body).not.toContain("**");

  expect(await surface.contentView.publishedDate()).toBeTruthy();
  expect(await surface.contentView.updatedDate()).toBeTruthy();
});
