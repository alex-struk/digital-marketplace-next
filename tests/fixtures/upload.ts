// A file an acceptance test asks to upload.
//
// A test names a file the way a person would — "scan0001.pdf", "portrait.png" — because
// what the criterion turns on is the name, the type, or the size, never a path on the
// machine the suite happens to be running on. A browser's file chooser needs a real file,
// so somebody has to make one, and this is the one place it happens: the same name, type
// and content whichever adapter is driving, so a criterion about a rejected file type
// cannot pass against one target and fail against another because two adapters invented
// different bytes.
//
// Files are written under the operating system's temporary directory and are never cleaned
// up during a run. A suite that removed them would have to know when the browser had
// finished reading one, and the browser does not say.
import { mkdtempSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, extname, isAbsolute } from "node:path";

export interface UploadRequest {
  /** The name the file is offered under, ending included. */
  name: string;
  /** What is in it. A string is written as UTF-8; bytes are written as they are. */
  content?: string | Uint8Array;
  /** How many bytes it should be, when the criterion turns on size rather than content. */
  bytes?: number;
}

// The smallest valid file of each type this knows how to make. A service that checks what
// a file actually is — rather than trusting its ending — has to be given something real,
// so a criterion about an accepted image must not turn on whether the harness wrote a
// convincing one.
const PNG_1x1 = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c636000000002000148afa4710000000049454e44ae426082",
  "hex",
);
const JPEG_1x1 = Buffer.from(
  "ffd8ffe000104a46494600010100000100010000ffdb004300ffffffffffffffffffffffffffffffffffffffff"
  + "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
  + "ffc2000b080001000101011100ffc40014000100000000000000000000000000000003ffda0008010100003f00d2cfffd9",
  "hex",
);
const PDF_EMPTY = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\n"
  + "trailer<</Root 1 0 R>>\n%%EOF\n",
  "utf8",
);

function defaultContent(name: string): Buffer {
  switch (extname(name).toLowerCase()) {
    case ".png": return PNG_1x1;
    case ".jpg":
    case ".jpeg": return JPEG_1x1;
    case ".pdf": return PDF_EMPTY;
    default: return Buffer.from(`${name}\n`, "utf8");
  }
}

let dir: string | null = null;
function uploadDir(): string {
  if (!dir) dir = mkdtempSync(join(tmpdir(), "sdlc-upload-"));
  return dir;
}

/**
 * Writes the file a test asked for and returns its path, for a file chooser to be given.
 *
 * A request that is already an absolute path to something that exists is returned as it
 * is, so an adapter that genuinely has a file on disk is not made to copy it.
 */
export function uploadFile(request: UploadRequest | string): string {
  const req: UploadRequest = typeof request === "string" ? { name: request } : request;
  if (isAbsolute(req.name) && existsSync(req.name)) return req.name;

  const path = join(uploadDir(), req.name);
  if (req.bytes !== undefined) {
    // Size is the whole point of the request, so the content is whatever fills it.
    writeFileSync(path, Buffer.alloc(req.bytes, 0x61));
    return path;
  }
  if (req.content === undefined) writeFileSync(path, defaultContent(req.name));
  else if (typeof req.content === "string") writeFileSync(path, req.content, "utf8");
  else writeFileSync(path, req.content);
  return path;
}
