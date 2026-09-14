// criterion: @R-8.17 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The criterion names no figure — only "the service's size limit" — so the limit is taken
// from where the criterion says a person must be able to find it: the attachment control,
// before a file is chosen. An upload a little over that figure is then made, and the refusal
// must name the same limit — in whatever units it chooses, so "10 MB" and "10485760 bytes"
// both name a ten-megabyte limit. Reading the stated figure as binary units and adding a
// margin keeps the upload over the limit whichever way the service counts a megabyte.
//
// "As the requester's error" is read as the refusal not being a fault of the service, and no
// file being stored.

// Every byte count a piece of text could mean by the sizes it names: a figure with a
// kilo/mega/giga unit is read both decimally and in binary, a bare figure as bytes.
function sizesNamedIn(text: string): number[] {
  const sizes: number[] = [];
  for (const [, figure, unit = ""] of text.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(bytes?|b|kb|kib|mb|mib|gb|gib)?\b/gi)) {
    const value = Number(figure.replace(/,/g, ""));
    const power = /^g/i.test(unit) ? 3 : /^m/i.test(unit) ? 2 : /^k/i.test(unit) ? 1 : 0;
    sizes.push(value * 1000 ** power, value * 1024 ** power);
  }
  return sizes;
}

function namesTheSameLimit(refusal: string, limit: number[]): boolean {
  return sizesNamedIn(refusal).some((size) => limit.some((bytes) => Math.abs(size - bytes) <= bytes * 0.005));
}

async function statedLimit(surface: Surface): Promise<{ sizes: number[]; bytes: number }> {
  await surface.opportunityCwuCreate.open();
  const statement = await surface.fileAttachmentControl.sizeLimitStatedBeforeChoosing();
  const match = statement.match(/(\d+(?:\.\d+)?)\s*(bytes?|b|kb|kib|mb|mib|gb|gib)\b/i);
  expect(match, `a size named in "${statement}"`).toBeTruthy();
  const [named, figure, unit] = match as RegExpMatchArray;
  const scale = /^g/i.test(unit) ? 1024 ** 3 : /^m/i.test(unit) ? 1024 ** 2 : /^k/i.test(unit) ? 1024 : 1;
  return { sizes: sizesNamedIn(named), bytes: Math.ceil(Number(figure) * scale * 1.05) + 1024 };
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
  const refusal = await surface.fileUpload.sizeLimitNamedInRefusal();
  expect(namesTheSameLimit(refusal, limit.sizes), `"${refusal}" names the stated limit`).toBe(true);
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

  const refusal = await surface.fileAttachmentControl.uploadRefusedForSize();
  expect(namesTheSameLimit(refusal, limit.sizes), `"${refusal}" names the stated limit`).toBe(true);
  expect(await surface.fileAttachmentControl.existingAttachmentRow()).not.toContain("R-8.17 oversized attachment.pdf");
});
