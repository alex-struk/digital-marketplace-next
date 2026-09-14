// criterion: @R-7.21 v1
// provenance: blind, spec@1c3743e9fb53c29de89a28045222abab29c5e27e, derived 2026-09-14
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

const statement =
  "A page's address must be lowercase letters and digits in hyphen-separated groups, and any other address is refused";

// One case per way of breaking the rule that the criterion names. Everything else about each
// submission is sound, so a mark on the form can only be about the address. The criterion is
// met by a refusal before the submission as much as after it, so an attempt to publish that
// does not go through is not itself a failure: what is checked is the address's mark, given
// time to appear, and that no page answers at the address afterwards.
const stamp = Date.now().toString(36);
const settle = { timeout: 15000 };
const malformed: Array<{ breaks: string; slug: string }> = [
  { breaks: "a capital letter", slug: `Derived-capital-${stamp}` },
  { breaks: "a space", slug: `derived space-${stamp}` },
  { breaks: "an underscore", slug: `derived_underscore-${stamp}` },
  { breaks: "a leading hyphen", slug: `-derived-leading-${stamp}` },
  { breaks: "a trailing hyphen", slug: `derived-trailing-${stamp}-` },
];

async function attemptToPublishNewPage(surface: Surface): Promise<void> {
  try {
    await surface.contentCreate.publishPage();
  } catch {
    // A form that withholds publishing from an invalid page has already refused it.
  }
  try {
    if (await surface.contentCreate.publishConfirmation()) await surface.contentCreate.confirmPublish();
  } catch {
    // No confirmation was offered, which is a refusal too.
  }
}

for (const { breaks, slug } of malformed) {
  test(`${statement} — an address containing ${breaks}`, async ({ surface }) => {
    await surface.signIn(persona.administrator);

    await surface.contentCreate.open();
    await surface.contentCreate.enterTitle({ title: "A page with an address that breaks the rule" });
    await surface.contentCreate.enterBody({ body: "A body that is perfectly acceptable." });
    await surface.contentCreate.enterSlug({ slug });
    await attemptToPublishNewPage(surface);

    await expect.poll(() => surface.contentCreate.fieldError(), settle).toBeTruthy();

    await surface.signOut();
    await surface.contentView.open({ slug });
    await expect.poll(() => surface.contentView.notFoundForUnknownAddress(), settle).toBeTruthy();
  });
}

// The other side of the rule: lowercase letters and digits in hyphen-separated groups make an
// address the service accepts, which is what shows the refusals above are about the rule.
test(`${statement} — an address of lowercase letters and digits in hyphen-separated groups is accepted`, async ({
  surface,
}) => {
  const slug = `derived-well-formed-2-${stamp}`;
  const title = "A page with an address that keeps the rule";
  await surface.signIn(persona.administrator);

  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title });
  await surface.contentCreate.enterBody({ body: "A body that is perfectly acceptable." });
  await surface.contentCreate.enterSlug({ slug });
  await attemptToPublishNewPage(surface);

  await surface.signOut();
  await surface.contentView.open({ slug });
  await expect.poll(() => surface.contentView.pageTitle(), settle).toBe(title);
});
