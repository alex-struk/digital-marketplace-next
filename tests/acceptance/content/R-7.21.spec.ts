// criterion: @R-7.21 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// One case per way of breaking the rule that the criterion names: a capital letter, a
// space, an underscore, a leading hyphen and a trailing hyphen. Everything else about each
// submission is sound, so a refusal can only be about the address.
const malformed = ["Capital-Letter", "two words", "under_score", "-leading-hyphen", "trailing-hyphen-"];

test("a page's address must be lowercase letters and digits in hyphen-separated groups, and any other address is refused", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  for (const address of malformed) {
    await surface.contentCreate.open();
    await surface.contentCreate.enterTitle({ title: "A page with an address that breaks the rule" });
    await surface.contentCreate.enterBody({ body: "A body that is perfectly acceptable." });
    await surface.contentCreate.enterSlug({ slug: address });
    await surface.contentCreate.publishPage();

    expect(await surface.contentCreate.fieldError()).toBeTruthy();
  }
});

test("the rule for a page's address is stated on the form, alongside the full public address the page will have", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.contentCreate.open();
  expect(await surface.contentCreate.slugRuleHelp()).toBeTruthy();

  const wellFormed = `derived-well-formed-${Date.now().toString(36)}`;
  await surface.contentCreate.enterSlug({ slug: wellFormed });
  expect(await surface.contentCreate.resultingPublicAddress()).toContain(wellFormed);
});
