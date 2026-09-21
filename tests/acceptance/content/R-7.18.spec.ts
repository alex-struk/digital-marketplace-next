// criterion: @R-7.18 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-21
import { test, expect } from "../../fixtures";

// Nobody signs in. The criterion asks only that the page the service's own screens link to
// stand on a fresh installation, so that following the link reaches an answer rather than
// the not-found screen; it says nothing about a managing screen, an address that cannot be
// typed over or a removal that is withheld, and none of those is read here.
//
// The surface addresses the link itself rather than each of the five screens that carry it:
// content-service-level-agreement-link offers the link, the address it leads to and the
// answer at that address. What is asserted is therefore the one thing all five screens
// depend on — the link resolves — read on the screen the surface reaches without signing in.
const settle = { timeout: 15000 };

test("The service level agreement page is one the service creates for itself, so every screen that links to it — the learn-more index, the program cards, and the Code With Us, Sprint With Us and Team With Us opportunity forms — resolves on a fresh installation", async ({
  surface,
}) => {
  // Given: a screen of a fresh installation that links to the service level agreement.
  await surface.contentServiceLevelAgreementLink.open();
  await expect
    .poll(() => surface.contentServiceLevelAgreementLink.serviceLevelAgreementLink(), {
      message: "given: the screen offers the service level agreement link",
      ...settle,
    })
    .toBeTruthy();
  expect(
    await surface.contentServiceLevelAgreementLink.linkTargetAddress(),
    "given: the link names an address to lead to",
  ).toBeTruthy();

  // When: the link is followed.
  await surface.contentServiceLevelAgreementLink.followServiceLevelAgreementLink();

  // Then: a page answers there.
  await expect
    .poll(() => surface.contentServiceLevelAgreementLink.answerAtLinkTarget(), {
      message: "the address the link leads to answers with a page",
      ...settle,
    })
    .toBeTruthy();
});
