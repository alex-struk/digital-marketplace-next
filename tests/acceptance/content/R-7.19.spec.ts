// criterion: @R-7.19 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect } from "../../fixtures";

// No sign-in: the footer's whole point is that it is the service's standing offer to any
// visitor. The five links are followed in turn without returning anywhere first, because
// the footer sits on every screen, including the ones the links lead to.
test("the service links its own footer to five of its pages, so every screen offers the about, disclaimer, privacy, accessibility and copyright pages to any visitor", async ({
  surface,
}) => {
  await surface.contentFooter.open();

  expect(await surface.contentFooter.presentWhenSignedOut()).toBeTruthy();
  expect(await surface.contentFooter.aboutLink()).toBeTruthy();
  expect(await surface.contentFooter.disclaimerLink()).toBeTruthy();
  expect(await surface.contentFooter.privacyLink()).toBeTruthy();
  expect(await surface.contentFooter.accessibilityLink()).toBeTruthy();
  expect(await surface.contentFooter.copyrightLink()).toBeTruthy();

  await surface.contentFooter.openAbout();
  expect(await surface.contentView.pageTitle()).toBeTruthy();

  await surface.contentFooter.openDisclaimer();
  expect(await surface.contentView.pageTitle()).toBeTruthy();

  await surface.contentFooter.openPrivacy();
  expect(await surface.contentView.pageTitle()).toBeTruthy();

  await surface.contentFooter.openAccessibility();
  expect(await surface.contentView.pageTitle()).toBeTruthy();

  await surface.contentFooter.openCopyright();
  expect(await surface.contentView.pageTitle()).toBeTruthy();
});
