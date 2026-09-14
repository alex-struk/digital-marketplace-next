// criterion: @R-8.29 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona } from "../../fixtures";

// Three claims, one walk, on a page this test publishes for itself so that no seeded page's
// history is changed. That the text refers to the image by an internal marker is asserted by
// what the inserted reference lacks: neither a scheme separator nor the download address the
// control reports. That the marker becomes an address only when the text is displayed is the
// published page showing the image. That the image is an ordinary file readable by anyone is
// read at the file's own address, both forms, by somebody with no session.

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

function fileIdIn(address: string): string {
  return address.split("?")[0].split(/\//).filter(Boolean).pop() ?? "";
}

test("an image placed into a piece of formatted text is stored as an ordinary file marked readable by anyone, and the text refers to it by an internal marker that is turned into a download address only when the text is displayed", async ({
  surface,
}) => {
  const slug = `r-8-29-image-${Date.now().toString(36)}`;

  await surface.signIn(persona.administrator);
  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title: "R-8.29 a page with an image in its body" });
  await surface.contentCreate.enterSlug({ slug });
  await surface.contentCreate.enterBody({ body: "Wording with room for an image after it." });
  await surface.contentCreate.publishPage();
  await surface.contentCreate.confirmPublish();

  await surface.contentEdit.open({ slug });
  await surface.contentEdit.startEditing();
  await surface.fileEmbeddedImage.uploadBodyImage({ file: "R-8.29 diagram.png", content: png(60, 40) });

  const inserted = await surface.fileEmbeddedImage.imageInsertedIntoText();
  const address = await surface.fileEmbeddedImage.imageAddress();
  const fileId = fileIdIn(address);
  expect(inserted).toBeTruthy();
  expect(fileId).toBeTruthy();
  expect(inserted.includes("://")).toBe(false);
  expect(inserted).not.toContain(address);

  await surface.contentEdit.publishChanges();
  await surface.contentEdit.confirmPublishChanges();
  expect(await surface.contentEdit.changesPublishedSuccess()).toBeTruthy();
  await surface.signOut();

  await surface.contentView.open({ slug });
  expect(await surface.fileEmbeddedImage.imageRenderedInPublishedText()).toBeTruthy();

  await surface.fileDescription.open({ fileId });
  expect(await surface.fileDescription.fileIdentifier()).toBe(fileId);

  await surface.fileDownload.open({ fileId });
  await surface.fileDownload.downloadFile();
  expect(await surface.fileDownload.readableWhenSignedOutIfPublic()).toBeTruthy();
  expect(await surface.fileDownload.fileContents()).toBeTruthy();
});
