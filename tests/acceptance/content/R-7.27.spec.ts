// criterion: @R-7.27 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";

// Both pages the given describes are seeded: seed.content.servicePageDisclaimer is a page the
// service made for itself that nobody has edited, and seed.content.changedByAnotherAdministrator
// was published by users.administratorOne and last changed by users.administratorTwo, so no
// second administrator has to be signed in as. The seed does not carry either person's name,
// so the second page is checked for naming two different people and not the service; that
// each name links to the person's profile is not reached by any observation.
async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

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

  const publishedBy = (await readOrEmpty(() => surface.contentEdit.publishedBy())).trim();
  const updatedBy = (await readOrEmpty(() => surface.contentEdit.updatedBy())).trim();

  expect(publishedBy).toBeTruthy();
  expect(updatedBy).toBeTruthy();
  expect(publishedBy).not.toBe("System");
  expect(updatedBy).not.toBe("System");
  expect(updatedBy).not.toBe(publishedBy);
});
