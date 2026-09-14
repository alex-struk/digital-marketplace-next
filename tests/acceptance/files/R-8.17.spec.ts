// criterion: @R-8.17 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The criterion names no figure — only "the service's size limit" — so the limit is taken
// from where the criterion says a person must be able to find it: the attachment control,
// before a file is chosen. An upload a little over that figure is then made, and the refusal
// must name the same figure. Reading the stated figure as binary units and adding a margin
// keeps the upload over the limit whichever way the service counts a megabyte.
//
// "As the requester's error" is read as the refusal not being a fault of the service, and no
// file being stored.
async function statedLimit(surface: Surface): Promise<{ figure: string; bytes: number }> {
  await surface.opportunityCwuCreate.open();
  const statement = await surface.fileAttachmentControl.sizeLimitStatedBeforeChoosing();
  const match = statement.match(/(\d+(?:\.\d+)?)\s*(bytes?|b|kb|kib|mb|mib|gb|gib)\b/i);
  expect(match, `a size named in "${statement}"`).toBeTruthy();
  const [, figure, unit] = match as RegExpMatchArray;
  const scale = /^g/i.test(unit) ? 1024 ** 3 : /^m/i.test(unit) ? 1024 ** 2 : /^k/i.test(unit) ? 1024 : 1;
  return { figure, bytes: Math.ceil(Number(figure) * scale * 1.05) + 1024 };
}

test("the size limit on an upload is stated in the interface before a person chooses a file", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();

  expect(await surface.fileAttachmentControl.sizeLimitStatedBeforeChoosing()).toBeTruthy();
});

test("an upload larger than the service's size limit is refused as the requester's error, with a message naming the limit", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  const limit = await statedLimit(surface);

  await surface.fileUpload.open();
  await surface.fileUpload.uploadFileStatingItsReadAccess({
    name: "R-8.17 oversized.pdf",
    content: Buffer.alloc(limit.bytes, 0x61),
    readAccess: [{ tag: "any" }],
  });

  expect(await surface.fileUpload.refusedForSize()).toBeTruthy();
  expect(await surface.fileUpload.sizeLimitNamedInRefusal()).toContain(limit.figure);
  expect(await surface.fileUpload.serviceFault()).toBeFalsy();
  expect(await surface.fileUpload.storedFileIdentifier()).toBeFalsy();
});

test("an attachment larger than the service's size limit is refused in the interface with a message naming the limit", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  const limit = await statedLimit(surface);

  await surface.fileAttachmentControl.addAttachment({
    file: "R-8.17 oversized attachment.pdf",
    content: Buffer.alloc(limit.bytes, 0x61),
  });
  await surface.opportunityCwuCreate.saveDraft({ title: "R-8.17 draft offered an oversized attachment" });

  expect(await surface.fileAttachmentControl.uploadRefusedForSize()).toContain(limit.figure);
  expect(await surface.fileAttachmentControl.existingAttachmentRow()).not.toContain("R-8.17 oversized attachment.pdf");
});
