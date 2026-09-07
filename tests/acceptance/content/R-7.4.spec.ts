// criterion: @R-7.4 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, seed } from "../../fixtures";

// The same position in the address is filled twice over, once with the page's identifier
// and once with its address, and both must reach one and the same record.
test("a page can also be read by its identifier", async ({ surface }) => {
  await surface.contentView.open({ slug: seed.content.ordinaryPage.id });

  expect(await surface.contentView.pageTitle()).toBe(seed.content.ordinaryPage.title);
});

test("the service falls back to treating the same value as an address when no page carries that identifier", async ({
  surface,
}) => {
  await surface.contentView.open({ slug: seed.content.ordinaryPage.slug });

  expect(await surface.contentView.pageTitle()).toBe(seed.content.ordinaryPage.title);
});
