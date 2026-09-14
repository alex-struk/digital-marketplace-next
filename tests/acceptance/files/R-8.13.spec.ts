// criterion: @R-8.13 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// The criterion's own example, 2000 pixels wide by 300 tall, and its mirror, 300 by 2000.
// Each exceeds only one limit, which is the case the criterion calls unambiguous; the case of
// an image over both limits is left alone, as the criterion's note leaves it open. The image
// is built here so that the dimensions uploaded are stated by the test itself, and the stored
// size is read back from the stored image.

// A greyscale PNG of the given size, uncompressed inside a valid zlib stream.
function png(width: number, height: number): Buffer {
  const table = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (bytes: Buffer): number => {
    let c = 0xffffffff;
    for (const byte of bytes) c = table[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer): Buffer => {
    const typed = Buffer.concat([Buffer.from(type, "latin1"), data]);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(typed));
    return Buffer.concat([length, typed, sum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  const rows = Buffer.alloc((width + 1) * height, 0x80);
  for (let y = 0; y < height; y++) rows[y * (width + 1)] = 0;
  const stream: Buffer[] = [Buffer.from([0x78, 0x01])];
  for (let at = 0; at < rows.length; at += 0xffff) {
    const block = rows.subarray(at, at + 0xffff);
    const head = Buffer.alloc(5);
    head[0] = at + 0xffff >= rows.length ? 1 : 0;
    head.writeUInt16LE(block.length, 1);
    head.writeUInt16LE(~block.length & 0xffff, 3);
    stream.push(head, block);
  }
  let a = 1;
  let b = 0;
  for (const byte of rows) {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  }
  const adler = Buffer.alloc(4);
  adler.writeUInt32BE(((b << 16) | a) >>> 0);
  stream.push(adler);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", Buffer.concat(stream)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

async function pixels(value: Promise<string>): Promise<number> {
  return Number.parseInt(await value, 10);
}

test("a profile picture wider than 500 pixels is narrowed to 500 pixels before it is stored, keeping its proportions", async ({
  surface,
}) => {
  await surface.signIn(persona.fileUploader);
  await surface.userProfileSelf.open();
  await surface.userProfileSelf.editProfile();
  await surface.fileImagePicker.chooseImage({ file: "R-8.13 wide.png", content: png(2000, 300) });
  await surface.userProfileSelf.saveChanges();

  expect(await pixels(surface.fileImagePicker.storedImageWidth())).toBe(500);
  expect(await pixels(surface.fileImagePicker.storedImageHeight())).toBe(75);
});

test("a profile picture taller than 500 pixels is shortened to 500 pixels before it is stored, keeping its proportions", async ({
  surface,
}) => {
  await surface.signIn(persona.fileUploader);
  await surface.userProfileSelf.open();
  await surface.userProfileSelf.editProfile();
  await surface.fileImagePicker.chooseImage({ file: "R-8.13 tall.png", content: png(300, 2000) });
  await surface.userProfileSelf.saveChanges();

  expect(await pixels(surface.fileImagePicker.storedImageWidth())).toBe(75);
  expect(await pixels(surface.fileImagePicker.storedImageHeight())).toBe(500);
});

test("an organization logo wider than 500 pixels is narrowed to 500 pixels before it is stored, keeping its proportions", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  await surface.organizationEdit.editOrganization();
  await surface.fileImagePicker.chooseImage({ file: "R-8.13 wide logo.png", content: png(2000, 300) });
  await surface.organizationEdit.saveChanges();

  expect(await pixels(surface.fileImagePicker.storedImageWidth())).toBe(500);
  expect(await pixels(surface.fileImagePicker.storedImageHeight())).toBe(75);
});
