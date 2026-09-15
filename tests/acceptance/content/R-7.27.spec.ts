// criterion: @R-7.27 v1
// provenance: blind, spec@08d8aac0ee7ec7fcee1a309ef183dcb17e38221b, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";

// The page the service created for itself carries no seed handle, so it is named by the
// address the spec gives it. The harness puts the target back to its seed before each test
// and the seed writes none of the service's own pages, so nobody has edited it when this
// runs; that it is one the service created is established from its managing screen before
// its authorship is read.
//
// The page an administrator created and another changed starts from the seeded ordinary
// page, which the seed records as created by administratorOne; administrator-other then
// changes it. The two people's names are read from their own profiles, which the seed
// identifies, rather than written out here. That each name links to its profile is not
// asserted: published_by and updated_by return text, and nothing returns where they lead.
const serviceMade = "accessibility";

test("The managing screen of a page names who first published it and who last changed it, and names the service itself where no person is recorded — a page the service created that nobody has edited", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.contentEdit.open({ slug: serviceMade });
  await expect
    .poll(() => surface.contentEdit.pageAddress(), { message: `given: this installation carries "${serviceMade}"` })
    .toContain(serviceMade);
  await expect
    .poll(() => surface.contentEdit.fixedPageWarning(), { message: "given: it is a page the service created for itself" })
    .toBeTruthy();

  await expect.poll(() => surface.contentEdit.publishedBy()).toContain("System");
  expect(await surface.contentEdit.updatedBy()).toContain("System");
});

test("The managing screen of a page names who first published it and who last changed it, and names the service itself where no person is recorded — a page one administrator created and another changed", async ({
  surface,
}) => {
  const ordinary = seed.content.ordinaryPage;

  await surface.signIn(persona.administrator);

  await surface.userProfile.open({ userId: seed.users.administratorOne.id });
  await expect.poll(() => surface.userProfile.nameField()).toBeTruthy();
  const creator = await surface.userProfile.nameField();

  await surface.userProfile.open({ userId: seed.users.administratorTwo.id });
  await expect.poll(() => surface.userProfile.nameField()).toBeTruthy();
  const changer = await surface.userProfile.nameField();

  expect(changer, "given: the two administrators are different people").not.toBe(creator);

  await surface.contentEdit.open({ slug: ordinary.slug });
  await expect
    .poll(() => surface.contentEdit.pageAddress(), { message: "given: the seeded ordinary page exists" })
    .toContain(ordinary.slug);
  await expect
    .poll(() => surface.contentEdit.publishedBy(), { message: "given: the page was first published by one administrator" })
    .toContain(creator);

  await surface.signOut();
  await surface.signIn(persona.administratorOther);
  await surface.contentEdit.open({ slug: ordinary.slug });
  await surface.contentEdit.startEditing();
  await surface.contentEdit.editBody({ body: "Wording a second administrator gave this page" });
  await surface.contentEdit.publishChanges();
  await surface.contentEdit.confirmPublishChanges();
  await expect.poll(() => surface.contentEdit.changesPublishedSuccess()).toBeTruthy();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.contentEdit.open({ slug: ordinary.slug });

  await expect.poll(() => surface.contentEdit.updatedBy()).toContain(changer);
  const publishedBy = await surface.contentEdit.publishedBy();
  const updatedBy = await surface.contentEdit.updatedBy();
  expect(publishedBy).toContain(creator);
  expect(publishedBy).not.toContain("System");
  expect(updatedBy).not.toContain("System");
});
