// criterion: @R-7.17 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";

// The never-executed clause is read against seed.content.scriptProbePage, whose body carries an
// inline script and an image failure handler, each raising a dialog if it runs. content-view's
// body_script_ran reports whether anything in the body ran, and that is all the test asserts of
// the markup. Whether it is then kept as an inert element, shown as literal text or taken out,
// the criterion does not say, so none of those is asserted.
//
// seed.content.rawMarkupPage carries raw markup beside formatting marks, as typed, and is used
// for the second clause: the same body reads identically on the page's own address and on the
// screens that embed it.
//
// The Sprint With Us scope page is what opportunity-swu-view embeds as scope_section, and the
// Team With Us terms page is what opportunity-twu-view embeds as terms_section. An
// administrator gives each the seeded markup body, then each is read in both places.
const markupPage = seed.content.rawMarkupPage;
const scopePage = seed.content.servicePageSprintWithUsOpportunityScope;
const termsPage = seed.content.servicePageTeamWithUsTerms;

// The words inside each tagged span survive every rendering the criterion allows, so they show
// that the body read back is the one published rather than an empty screen matching another.
const taggedWords = [...markupPage.body.matchAll(/<(\w+)>([^<]*)<\/\1>/g)].map((m) => m[2]);

function normalised(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

test("a page's body is rendered as formatted text only; markup embedded in it is never executed", async ({
  surface,
}) => {
  const probe = seed.content.scriptProbePage;
  await surface.contentView.open({ slug: probe.slug });

  expect(await surface.contentView.pageTitle()).toBe(probe.title);
  expect(await surface.contentView.pageBody()).toContain("These words are in an emphasis tag.");

  expect(await surface.contentView.bodyScriptRan()).toBeFalsy();
});

test("the same body renders identically on the page's own address and wherever another screen embeds it", async ({
  surface,
}) => {
  expect(taggedWords.length).toBeGreaterThan(0);

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

  for (const words of taggedWords) {
    expect(scopeOnItsOwnAddress).toContain(words);
    expect(termsOnItsOwnAddress).toContain(words);
  }

  expect(scopeEmbedded).toBe(scopeOnItsOwnAddress);
  expect(termsEmbedded).toBe(termsOnItsOwnAddress);
});
