// criterion: @R-7.27 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// "accessibility" is a page the service created for itself and that nothing else in this
// domain writes to, so when this runs no person has ever touched it. It carries no seed
// handle, so its address is written out as the criteria give it.
const untouched = "accessibility";
const address = `derived-authored-${Date.now().toString(36)}`;

test("the managing screen of a page the service created for itself and nobody has edited names the service itself as both publisher and last editor", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.contentEdit.open({ slug: untouched });

  expect(await surface.contentEdit.publishedBy()).toContain("System");
  expect(await surface.contentEdit.updatedBy()).toContain("System");
});

// The criterion's second given is a page one administrator created and another later
// changed. The target carries one administrator sign-in and no second one, so the two
// names cannot be made to differ; what is asserted is that a page a person made and
// changed names that person rather than the service.
test("the managing screen of a page an administrator created and changed names who first published it and who last changed it", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title: "A page a person made" });
  await surface.contentCreate.enterSlug({ slug: address });
  await surface.contentCreate.enterBody({ body: "The wording it was published with." });
  await surface.contentCreate.publishPage();
  await surface.contentCreate.confirmPublish();

  await surface.contentEdit.open({ slug: address });
  await surface.contentEdit.startEditing();
  await surface.contentEdit.editBody({ body: "The wording it was changed to." });
  await surface.contentEdit.publishChanges();
  await surface.contentEdit.confirmPublishChanges();

  await surface.contentEdit.open({ slug: address });
  const publishedBy = await surface.contentEdit.publishedBy();
  const updatedBy = await surface.contentEdit.updatedBy();

  expect(publishedBy).toBeTruthy();
  expect(publishedBy).not.toContain("System");
  expect(updatedBy).toBeTruthy();
  expect(updatedBy).not.toContain("System");
});
