// criterion: @R-7.17 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";

// seed.content.rawMarkupPage carries formatting marks beside raw markup, as typed. page_body
// is the rendered text a reader sees: formatting marks turned into formatting leave no "**"
// behind, and markup that is never executed reaches the reader as the literal string it was
// typed as. Markup that ran, or was quietly taken out, leaves no tag in the text, and neither
// can be told from the other — so the tags reaching the reader as text is what is asserted.
// The tagged spans are taken from the seeded body itself rather than written out here.
const markupPage = seed.content.rawMarkupPage;
const taggedSpans = markupPage.body.match(/<(\w+)>[^<]*<\/\1>/g) ?? [];

// The embedded rendering: the Sprint With Us scope page (a page the service needs) is what
// opportunity-swu-view embeds as scope_section, and the Team With Us terms page is what
// opportunity-twu-view embeds as terms_section. An administrator gives each the seeded
// markup body, then the same body is read on its own address and on the screen that embeds it.
const scopePage = seed.content.servicePageSprintWithUsOpportunityScope;
const termsPage = seed.content.servicePageTeamWithUsTerms;

function normalised(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

test("a page's body is rendered as formatted text only; markup embedded in it is never executed", async ({ surface }) => {
  expect(taggedSpans.length).toBeGreaterThan(0);

  await surface.contentView.open({ slug: markupPage.slug });
  const body = await surface.contentView.pageBody();

  expect(body).not.toContain("**");
  for (const span of taggedSpans) {
    expect(body).toContain(span);
  }
});

test("the same body renders identically on the page's own address and wherever another screen embeds it", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  for (const embedded of [scopePage, termsPage]) {
    await surface.contentEdit.open({ slug: embedded.slug });
    await surface.contentEdit.startEditing();
    await surface.contentEdit.editBody({ body: markupPage.body });
    await surface.contentEdit.publishChanges();
    await surface.contentEdit.confirmPublishChanges();
    expect(await surface.contentEdit.changesPublishedSuccess(), embedded.slug).toBeTruthy();
  }

  await surface.contentView.open({ slug: scopePage.slug });
  const scopeOnItsOwnAddress = normalised(await surface.contentView.pageBody());
  await surface.opportunitySwuView.open({ opportunityId: seed.opportunities.closedSprintWithUs.id });
  const scopeEmbedded = normalised(await surface.opportunitySwuView.scopeSection());

  await surface.contentView.open({ slug: termsPage.slug });
  const termsOnItsOwnAddress = normalised(await surface.contentView.pageBody());
  await surface.opportunityTwuView.open({ opportunityId: seed.opportunities.closedTeamWithUs.id });
  const termsEmbedded = normalised(await surface.opportunityTwuView.termsSection());

  expect(scopeOnItsOwnAddress).toBeTruthy();
  expect(scopeEmbedded).toBe(scopeOnItsOwnAddress);
  expect(termsEmbedded).toBe(termsOnItsOwnAddress);

  for (const span of taggedSpans) {
    expect(scopeEmbedded).toContain(span);
    expect(termsEmbedded).toContain(span);
  }
});
