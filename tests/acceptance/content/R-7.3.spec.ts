// criterion: @R-7.3 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect } from "../../fixtures";

// Only the visitor-facing half of this criterion is asserted here. Whether the service
// answers a malformed address as an invalid request rather than as not found is a fact
// about the shape of its answer, and nothing in the surface reports that: content-view
// offers not_found_for_unknown_address and no observation of a refusal status, while
// observables.yaml names a `refusal` status for files and exports only. What can be shown
// is the claim the criterion makes about a person browsing: both addresses, the malformed
// one and the merely unknown one, land on the same not-found screen.
test("a visitor using the service sees the not-found screen either way, whether the address is malformed or merely one no page holds", async ({
  surface,
}) => {
  await surface.contentView.open({ slug: "Not_A_Slug" });
  const malformed = await surface.contentView.notFoundForUnknownAddress();
  expect(malformed).toBeTruthy();

  await surface.contentView.open({ slug: "nothing-here" });
  const unknown = await surface.contentView.notFoundForUnknownAddress();
  expect(unknown).toBeTruthy();

  expect(malformed).toBe(unknown);
});
