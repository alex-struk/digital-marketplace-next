// criterion: @R-7.27 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";

// Both pages the given describes are seeded: seed.content.servicePageDisclaimer is a page the
// service made for itself that nobody has edited, and seed.content.changedByAnotherAdministrator
// was published by users.administratorOne and last changed by users.administratorTwo, so no
// second administrator has to be signed in as. The seed names both people, and
// published_by_link / updated_by_link give where each name links: that person's profile,
// which is addressed by the person's identifier.
const publisher = seed.users.administratorOne;
const lastEditor = seed.users.administratorTwo;

test("the managing screen of a page names the service itself as publisher and last editor where no person is recorded", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.contentEdit.open({ slug: seed.content.servicePageDisclaimer.slug });

  expect((await surface.contentEdit.publishedBy()).trim()).toBe("System");
  expect((await surface.contentEdit.updatedBy()).trim()).toBe("System");
});

test("the managing screen of a page names who first published it and who last changed it", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.contentEdit.open({ slug: seed.content.changedByAnotherAdministrator.slug });

  expect((await surface.contentEdit.publishedBy()).trim()).toBe(publisher.name);
  expect((await surface.contentEdit.updatedBy()).trim()).toBe(lastEditor.name);

  expect(await surface.contentEdit.publishedByLink()).toContain(publisher.id);
  expect(await surface.contentEdit.updatedByLink()).toContain(lastEditor.id);
});
