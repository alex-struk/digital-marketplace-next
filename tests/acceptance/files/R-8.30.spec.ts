// criterion: @R-8.30 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona } from "../../fixtures";

// The criterion's own example: a file named "portrait.gif" chosen as a profile picture. Its
// content is a real PNG, built here, so the name is the only thing wrong with it and a refusal
// can only have come from the ending. "No file is stored" is read as the picture being
// unchanged once the edit is abandoned.

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

test("a profile picture or an organization logo whose name does not end in .jpg, .jpeg or .png is refused", async ({
  surface,
}) => {
  await surface.signIn(persona.fileUploader);
  await surface.userProfileSelf.open();
  const before = await surface.fileImagePicker.currentImage();

  await surface.userProfileSelf.editProfile();
  expect(await surface.fileImagePicker.onlyJpegAndPngOffered()).toBeTruthy();

  await surface.fileImagePicker.chooseImage({ file: "portrait.gif", content: png(40, 40) });
  expect(await surface.fileImagePicker.rejectedImageError()).toBeTruthy();

  await surface.userProfileSelf.cancelEditing();
  expect(await surface.fileImagePicker.currentImage()).toBe(before);
});
