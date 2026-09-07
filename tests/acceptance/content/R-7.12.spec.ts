// criterion: @R-7.12 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// The pages the service creates for itself have no seed handle — the seed manifest records
// deliberately that they arrive with the installation rather than with the seed — so the
// one addressed here is written out by the address the criteria give it. "copyright" is
// chosen because no other test in this domain writes to it, so it is still the placeholder
// the criterion describes when this runs.
//
// Two parts of the outcome are not asserted. That twenty-two pages are listed cannot be:
// no observation returns the number of rows on the list, and the seed adds an ordinary
// page of its own, so the list is never exactly the set the installation was made with.
// Nor can the installation be returned to a fresh state — nothing in the surface resets it.
const needed = "copyright";

test("a page the service needs exists and answers, its title is its own address, and its body holds placeholder text until somebody writes it", async ({
  surface,
}) => {
  await surface.contentView.open({ slug: needed });

  expect(await surface.contentView.pageTitle()).toBe(needed);
  expect(await surface.contentView.pageBody()).toContain("Initial version");
});

test("a page the service needs is marked as one the service needs", async ({ surface }) => {
  await surface.signIn(persona.administrator);

  await surface.contentEdit.open({ slug: needed });

  expect(await surface.contentEdit.fixedPageWarning()).toBeTruthy();
});
