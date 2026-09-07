// criterion: @R-7.2 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect } from "../../fixtures";

// "nothing-here" is the address the criterion itself names as one no page holds. There is
// no seed handle for an absence, so the address is written out as the criterion states it.
// The observation covers both halves of the outcome: the not-found screen, and no content.
test("a request for a page at an address that no page holds is answered as not found", async ({ surface }) => {
  await surface.contentView.open({ slug: "nothing-here" });

  expect(await surface.contentView.notFoundForUnknownAddress()).toBeTruthy();
});
