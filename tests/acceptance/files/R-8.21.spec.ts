// criterion: @R-8.21 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// "Whatever its name says" is the point, so the refused file carries an ending the picker
// accepts and content that is not an image: a refusal can only have come from reading the
// content. The accepted file is a real PNG, built here; accepting it is seen as no refusal
// and the picture having been set once the change is saved. The size it is stored at is not
// this criterion's concern.
//
// The last clause — an image that reads successfully but cannot be resized is stored at its
// original size rather than refused — is not asserted. Nothing in the surface produces an
// image the reader accepts and the resizer then fails on, and nothing names what such an image
// would be, so the condition cannot be set up.

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

test("a profile picture whose content is neither a JPEG nor a PNG is refused whatever its name says", async ({
  surface,
}) => {
  await surface.signIn(persona.fileUploader);
  await surface.userProfileSelf.open();
  const before = await surface.fileImagePicker.currentImage();

  await surface.userProfileSelf.editProfile();
  await surface.fileImagePicker.chooseImage({ file: "R-8.21 portrait.png", content: "this is not an image at all" });
  expect(await surface.fileImagePicker.rejectedImageError()).toBeTruthy();

  await surface.userProfileSelf.cancelEditing();
  expect(await surface.fileImagePicker.currentImage()).toBe(before);
});

test("an organization logo whose content is neither a JPEG nor a PNG is refused whatever its name says", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  await surface.organizationEdit.editOrganization();
  await surface.fileImagePicker.chooseImage({ file: "R-8.21 logo.jpg", content: "this is not an image either" });

  expect(await surface.fileImagePicker.rejectedImageError()).toBeTruthy();

  await surface.organizationEdit.cancelEditing();
});

test("a profile picture whose content can be read as a PNG is accepted", async ({ surface }) => {
  await surface.signIn(persona.fileUploader);
  await surface.userProfileSelf.open();
  const before = await surface.fileImagePicker.currentImage();

  await surface.userProfileSelf.editProfile();
  await surface.fileImagePicker.chooseImage({ file: "R-8.21 real portrait.png", content: png(40, 30) });

  expect(await surface.fileImagePicker.rejectedImageError()).toBeFalsy();

  await surface.userProfileSelf.saveChanges();
  const after = await surface.fileImagePicker.currentImage();
  expect(after).toBeTruthy();
  expect(after).not.toBe(before);
});
