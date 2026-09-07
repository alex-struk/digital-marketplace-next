// criterion: @R-7.18 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// Only the first half of the criterion is asserted here: that a page stands at the
// service level agreement address and is one the service creates for itself. The pages
// the service creates for itself carry no seed handle, so this one is written out by the
// address the criteria give it, exactly as the copyright and disclaimer pages are.
//
// The five links themselves are not followed, and none of them can be: no surface exists
// for the learn-more index; the program cards are reachable only as the observation
// opportunity_program_select.program_card, which has no link to follow; and none of the
// Code With Us, Sprint With Us or Team With Us opportunity forms names an action that
// follows a service level agreement link. So "every screen that links to it resolves" is
// left unasserted, and what stands in its place is the condition all five links depend
// on — that the page they point at exists and cannot be renamed or removed out from
// under them. Nor can the installation be returned to a fresh state; nothing in the
// surface resets it.
const needed = "service-level-agreement";

test("the service level agreement page is one the service creates for itself", async ({ surface }) => {
  await surface.contentView.open({ slug: needed });

  expect(await surface.contentView.readableWhenSignedOut()).toBeTruthy();
  expect(await surface.contentView.pageTitle()).toBeTruthy();
  expect(await surface.contentView.pageBody()).toBeTruthy();

  await surface.signIn(persona.administrator);
  await surface.contentEdit.open({ slug: needed });

  expect(await surface.contentEdit.fixedPageWarning()).toBeTruthy();
  expect(await surface.contentEdit.slugLockedForFixedPage()).toBeTruthy();
  expect(await surface.contentEdit.deleteWithheldForFixedPage()).toBeTruthy();
});
