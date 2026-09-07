// criterion: @R-7.17 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// A page is built carrying both a formatting mark and a piece of raw markup. If the body
// is rendered as formatted text only, the formatting mark is gone from what a reader sees.
//
// Two halves of the criterion are not asserted. "Never executed" is not: contentView
// .pageBody() hands back the rendered body as text, and a rebuild that renders the markup
// as literal characters and one that strips it out are both conforming, so neither the
// markup's presence nor its absence in that text tells execution from non-execution. The
// raw markup is still written into the body, so the page under test is the one the
// criterion describes, but nothing is claimed about how it comes back.
//
// Nor is the claim that the same body renders identically wherever another screen embeds
// it. The bodies other screens embed belong to the pages the service creates for itself,
// which the seed does not name and which no surface addresses by handle, so no body a
// test can write reaches an embedded rendering.
const address = `derived-markup-${Date.now().toString(36)}`;
const markup = "<b>this was written as markup</b>";
const body = `A **formatted** word and then ${markup} left raw.`;

test("a page's body is rendered as formatted text only", async ({
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
});
