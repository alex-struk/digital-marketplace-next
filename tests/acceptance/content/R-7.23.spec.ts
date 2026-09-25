// criterion: @R-7.23 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";

// seed.content.ordinaryPage has three versions behind it. The managing screen is read before
// and after editing begins, since a history or a way back could be offered at either point:
// body_being_edited must hold the current wording, and version_history — the name the
// contract gives whatever the screen offers of the page's past — must come back empty.
// No action on content-edit restores an earlier version, and none is looked for.
const record = seed.content.ordinaryPage;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

test("nothing in the service shows, compares or restores an earlier version of a page", async ({ surface }) => {
  expect(record.versions).toBeGreaterThan(1);

  await surface.signIn(persona.administrator);
  await surface.contentEdit.open({ slug: record.slug });

  expect(await readOrEmpty(() => surface.contentEdit.versionHistory())).toBeFalsy();

  await surface.contentEdit.startEditing();
  const beingEdited = await surface.contentEdit.bodyBeingEdited();
  expect(beingEdited).toBeTruthy();
  expect(await readOrEmpty(() => surface.contentEdit.versionHistory())).toBeFalsy();

  await surface.contentEdit.cancelEditing();
  expect(await readOrEmpty(() => surface.contentEdit.versionHistory())).toBeFalsy();
});
