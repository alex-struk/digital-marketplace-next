// criterion: @R-7.17 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// A page is built carrying both a formatting mark and a piece of raw markup. If the body
// is rendered as formatted text only, the formatting mark is gone from what a reader sees
// and the markup is still there, character for character, because it was never executed.
//
// The other half of the criterion — that the same body renders identically wherever
// another screen embeds it — is not asserted. The bodies other screens embed belong to the
// pages the service creates for itself, which the seed does not name, and no observation
// pairs a body's own rendering with its embedded one.
const address = `derived-markup-${Date.now().toString(36)}`;
const markup = "<b>this was written as markup</b>";
const body = `A **formatted** word and then ${markup} left raw.`;

test("a page's body is rendered as formatted text only, and markup embedded in it is never executed", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title: "A page carrying raw markup" });
  await surface.contentCreate.enterSlug({ slug: address });
  await surface.contentCreate.enterBody({ body });
  await surface.contentCreate.publishPage();
  await surface.contentCreate.confirmPublish();

  await surface.signOut();
  await surface.contentView.open({ slug: address });

  const rendered = await surface.contentView.pageBody();
  // Formatted: the marks around the emphasised word have been consumed.
  expect(rendered).toContain("formatted");
  expect(rendered).not.toContain("**");
  // Never executed: the markup survives as the text it was written as.
  expect(rendered).toContain(markup);
});
