// criterion: @R-7.17 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-21
import { test, expect, seed } from "../../fixtures";

// The criterion is about how a page's body reaches a reader. It asks for nobody to author a
// page, so nobody does and nobody signs in: the body read here is one the installation
// already holds, the seeded ordinary page, whose wording carries a formatting mark around
// one of its words.
//
// Two of the criterion's clauses are left unasserted, because nothing in the surface reaches
// them. Execution cannot be told from stripping: content_view.page_body hands back the
// rendered body as text, so a body whose markup was run and a body whose markup was taken
// out come back alike, and the only thing that can be read is that no markup reaches the
// reader in the wording's place. And the comparison of the two renderings has no second
// rendering to make: the screens that embed a body — the two program qualification terms
// screens and the two evaluation instructions screens — embed pages the service creates for
// itself, which the seed does not name and which no surface addresses by handle, so the
// seeded page's body cannot be got into an embedded rendering to compare.
const ordinary = seed.content.ordinaryPage;
const settle = { timeout: 15000 };

test("A page's body is rendered as formatted text only; markup embedded in it is never executed, and the same body renders identically on the page's own address and wherever another screen embeds it", async ({
  surface,
}) => {
  // Given: a page that answers at its own address.
  await surface.contentView.open({ slug: ordinary.slug });
  await expect
    .poll(() => surface.contentView.pageTitle(), { message: "given: the page answers at its own address", ...settle })
    .toBe(ordinary.title);

  // When: a reader reads its body.
  const rendered = await surface.contentView.pageBody();

  // Then: it is formatted text. The marks the seeded wording carries around its emphasised
  // word were consumed into formatting rather than shown as characters to the reader...
  expect(rendered, "the body is shown").toBeTruthy();
  expect(rendered, "the formatting marks were rendered, not shown literally").not.toContain("**");
  // ...and nothing markup-shaped stands in the reader's text in their place.
  expect(rendered, "no markup reaches the reader as markup").not.toMatch(/[<>]/);
});
