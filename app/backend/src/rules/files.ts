/**
 * Rules about stored files, as plain TypeScript.
 *
 * Nothing in this directory imports NestJS, Prisma or Node. The service and the single-page
 * app both call these functions, so the limits a person is told before choosing a file are the
 * limits the service holds them to (decision record 0001; R-8.17).
 */

import type { AccountKind } from "./users";

// ------------------------------------------------------------------------ limits

/** The largest upload the service accepts, in bytes (R-8.17). */
export const FILE_SIZE_LIMIT_BYTES = 10 * 1024 * 1024;

/** The same limit, as a person is told it. */
export const FILE_SIZE_LIMIT_LABEL = "10 MB";

/** The message an upload over the limit is refused with; it names the limit (R-8.17). */
export const FILE_TOO_LARGE_MESSAGE = `The file is larger than ${FILE_SIZE_LIMIT_LABEL}. Upload a file of ${FILE_SIZE_LIMIT_LABEL} or smaller.`;

export const FILE_NAME_MAX_LENGTH = 255;

/** The message a name of the wrong length is refused with (R-8.23). */
export const FILE_NAME_LENGTH_MESSAGE = `The file name must be between 1 and ${FILE_NAME_MAX_LENGTH} characters long.`;

/** A name to store a file under: one to 255 characters, nothing else checked (R-8.23). */
export function fileNameError(name: string | null | undefined): string | null {
  const length = (name ?? "").length;
  return length >= 1 && length <= FILE_NAME_MAX_LENGTH ? null : FILE_NAME_LENGTH_MESSAGE;
}

// ------------------------------------------------------------------------ pictures

/** The endings a profile picture or logo's name may have, compared without regard to case (R-8.30). */
export const IMAGE_ENDINGS = [".jpg", ".jpeg", ".png"] as const;

/** The types the picture chooser offers (R-8.21, R-8.30). */
export const IMAGE_TYPES = ["image/jpeg", "image/png"] as const;

export function hasImageEnding(name: string): boolean {
  const lower = name.toLowerCase();
  return IMAGE_ENDINGS.some((ending) => lower.endsWith(ending));
}

export const IMAGE_ENDING_MESSAGE =
  "A profile picture or logo must be a JPEG or PNG image whose name ends in .jpg, .jpeg or .png.";

export type ImageKind = "jpeg" | "png";

/** How many of a file's first bytes {@link imageKindOf} needs to tell what it is. */
export const IMAGE_SIGNATURE_LENGTH = 8;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;

/**
 * What the content's first bytes say it is: JPEG (FF D8 FF) or PNG (its eight-byte signature).
 * The name is never consulted. The service decides by this, and the picture chooser asks the
 * same of a chosen file so that its refusal is shown where the file was chosen (R-8.21).
 */
export function imageKindOf(content: Uint8Array): ImageKind | null {
  if (content.length >= 3 && content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff) {
    return "jpeg";
  }
  if (
    content.length >= PNG_SIGNATURE.length &&
    PNG_SIGNATURE.every((byte, index) => content[index] === byte)
  ) {
    return "png";
  }
  return null;
}

export const IMAGE_CONTENT_MESSAGE =
  "A profile picture or logo must be a JPEG or PNG image. This file's content is neither.";

/** How wide and how tall a stored picture or logo may be, in pixels (R-8.13). */
export const IMAGE_MAX_WIDTH = 500;
export const IMAGE_MAX_HEIGHT = 500;

/**
 * The size a picture is stored at (R-8.13). One wider than the limit is narrowed to it, then
 * one still taller than the limit is shortened to it, each time keeping its proportions; a
 * picture within both limits is kept as it is. No side is made smaller than one pixel.
 */
export function storedImageSize(
  width: number,
  height: number,
  maxWidth: number = IMAGE_MAX_WIDTH,
  maxHeight: number = IMAGE_MAX_HEIGHT,
): { width: number; height: number } {
  let w = width;
  let h = height;
  if (w > maxWidth) {
    h = Math.max(1, Math.round((h * maxWidth) / w));
    w = maxWidth;
  }
  if (h > maxHeight) {
    w = Math.max(1, Math.round((w * maxHeight) / h));
    h = maxHeight;
  }
  return { width: w, height: h };
}

// ------------------------------------------------------------------------ read access

/**
 * One statement of who may read a file, as an upload carries it (R-8.24): anyone, one named
 * account, or every account of one kind.
 */
export type ReadAccess =
  | { readonly tag: "any" }
  | { readonly tag: "user"; readonly value: string }
  | { readonly tag: "userType"; readonly value: AccountKind };

export type ReadAccessReading =
  | { readonly ok: true; readonly access: readonly ReadAccess[] }
  | { readonly ok: false; readonly message: string };

const ACCOUNT_KINDS: readonly AccountKind[] = ["VENDOR", "GOV", "ADMIN"];

const IDENTIFIER = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isIdentifier(value: unknown): value is string {
  return typeof value === "string" && IDENTIFIER.test(value);
}

/** The words every refusal of read-access information begins with (R-8.24). */
export const READ_ACCESS_INVALID = "The read-access information provided was invalid";

function oneStatement(entry: unknown): ReadAccess | string {
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    return "each statement must name a kind of access.";
  }
  const { tag, value } = entry as { tag?: unknown; value?: unknown };
  switch (tag) {
    case "any":
      return { tag: "any" };
    case "user":
      return isIdentifier(value)
        ? { tag: "user", value: value.toLowerCase() }
        : "a statement naming a person must carry that person's account identifier.";
    case "userType":
      return ACCOUNT_KINDS.includes(value as AccountKind)
        ? { tag: "userType", value: value as AccountKind }
        : "a statement naming a kind of account must name one of VENDOR, GOV or ADMIN.";
    default:
      return `${JSON.stringify(tag ?? null)} is not a kind of access the service recognises.`;
  }
}

/**
 * Reads the read-access statement an upload carries, as the form field holds it: JSON, either
 * one statement or a list of them. A list may be empty, which records no read access against
 * the file at all (R-8.19). Missing information, information that is not well-formed data, and
 * a statement naming a kind of access the service does not recognise are each refused, naming
 * what was wrong (R-8.18, R-8.24). Repeated statements are reduced to one.
 */
export function readAccessFrom(raw: string | null | undefined): ReadAccessReading {
  if (raw === null || raw === undefined || raw.trim() === "") {
    return { ok: false, message: `${READ_ACCESS_INVALID}: say who may read the file.` };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, message: `${READ_ACCESS_INVALID}: it is not well-formed data.` };
  }
  const entries = Array.isArray(parsed) ? parsed : [parsed];
  const access: ReadAccess[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    const statement = oneStatement(entry);
    if (typeof statement === "string") {
      return { ok: false, message: `${READ_ACCESS_INVALID}: ${statement}` };
    }
    const key = `${statement.tag}:${"value" in statement ? statement.value : ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    access.push(statement);
  }
  return { ok: true, access };
}

/** Who is asking to read a file: an account, or a visitor who is not signed in. */
export interface FileReader {
  readonly id: string;
  readonly type: AccountKind;
}

/** What is recorded about who may read one stored file. */
export interface FileGrants {
  readonly createdBy: string | null;
  readonly public: boolean;
  readonly users: readonly string[];
  readonly userTypes: readonly AccountKind[];
}

/**
 * Whether a file may be read by what was recorded against it (R-8.7): it was marked readable by
 * anyone, it names the reader, it names the reader's kind of account, the reader uploaded it, or
 * the reader is an administrator. Any one is enough. A visitor may read only a file marked
 * readable by anyone.
 *
 * What a file is attached to can also make it readable (R-8.20); that is asked of the thing it
 * is attached to, not answered here.
 */
export function mayReadByGrants(file: FileGrants, reader: FileReader | null): boolean {
  if (file.public) return true;
  if (!reader) return false;
  if (reader.type === "ADMIN") return true;
  if (file.createdBy !== null && file.createdBy === reader.id) return true;
  if (file.users.includes(reader.id)) return true;
  return file.userTypes.includes(reader.type);
}

// ------------------------------------------------------------------------ content type

const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  webp: "image/webp",
  txt: "text/plain",
  csv: "text/csv",
  md: "text/markdown",
  html: "text/html",
  htm: "text/html",
  json: "application/json",
  xml: "application/xml",
  zip: "application/zip",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odt: "application/vnd.oasis.opendocument.text",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  rtf: "application/rtf",
};

/** Unspecified binary data: a name with no recognised ending (R-8.10). */
export const UNSPECIFIED_CONTENT_TYPE = "application/octet-stream";

/**
 * The content type a file is described by, worked out from the ending of its name alone; the
 * content is never looked at (R-8.10).
 */
export function contentTypeForName(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot < 0 || dot === name.length - 1) return UNSPECIFIED_CONTENT_TYPE;
  return CONTENT_TYPES[name.slice(dot + 1).toLowerCase()] ?? UNSPECIFIED_CONTENT_TYPE;
}

/** The address a stored file's content is read at; every download in the interface is this (R-8.10). */
export function fileContentAddress(fileId: string): string {
  return `/api/files/${fileId}?type=blob`;
}

// ------------------------------------------------------------------------ images in formatted text

/**
 * How formatted text refers to an image stored in the service: an internal marker carrying the
 * file's identifier, never a web address, so the same text renders wherever the service runs
 * and whatever address it answers on (R-8.29).
 */
export const EMBEDDED_FILE_PREFIX = "@file/";

/** The marker an inserted image's reference carries. */
export function embeddedFileMarker(fileId: string): string {
  return `${EMBEDDED_FILE_PREFIX}${fileId}`;
}

/** The image reference the body editor inserts, with alternative text for the author to replace. */
export const EMBEDDED_IMAGE_PLACEHOLDER_ALT = "Describe this image";

export function embeddedImageReference(fileId: string): string {
  return `![${EMBEDDED_IMAGE_PLACEHOLDER_ALT}](${embeddedFileMarker(fileId)})`;
}

/**
 * Where an image in formatted text is read from, decided only when the text is displayed. A
 * marker naming a well-formed file identifier becomes that file's content address; anything
 * else — including a marker that does not resolve — is left as it was written and treated as
 * an ordinary address (R-8.29).
 */
export function resolveEmbeddedFile(source: string): string {
  if (!source.startsWith(EMBEDDED_FILE_PREFIX)) return source;
  const fileId = source.slice(EMBEDDED_FILE_PREFIX.length);
  return isIdentifier(fileId) ? fileContentAddress(fileId) : source;
}
