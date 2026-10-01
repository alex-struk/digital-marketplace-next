import { randomUUID } from "node:crypto";
import { createWriteStream, mkdirSync } from "node:fs";
import { readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { IncomingMessage } from "node:http";
import busboy from "busboy";
import { FILE_SIZE_LIMIT_BYTES } from "../rules/files";

/**
 * Receiving an upload (R-8.2, R-8.16).
 *
 * The file part of a submission is written to a working directory on the service's own disk —
 * in a sandbox, the backend's `emptyDir` volume — and read from there when it is stored. The
 * working copy is removed once the upload has been answered, whether it was stored or refused
 * (R-8.18).
 */

export const UPLOADS_DIRECTORY = Symbol("UploadsDirectory");

/**
 * The working directory, from `FILE_UPLOADS_DIR`, made when the service starts. A directory
 * that cannot be made stops the service starting, as the old application's did (R-8.16).
 */
export function uploadsDirectoryFrom(environment: NodeJS.ProcessEnv): string {
  const directory = environment.FILE_UPLOADS_DIR?.trim() || join(tmpdir(), "digital-marketplace-uploads");
  mkdirSync(directory, { recursive: true });
  return directory;
}

export interface ReceivedFile {
  /** Where the working copy is. */
  readonly path: string;
  /** How many bytes arrived, up to one past the limit. */
  readonly size: number;
  /** The file was larger than the limit; what arrived was cut short. */
  readonly tooLarge: boolean;
}

export interface ReceivedUpload {
  /** The submission's text fields; only `name` and `metadata` are ever read (R-8.2). */
  readonly fields: Readonly<Record<string, string>>;
  /** The first file part, or null when the submission carried none. */
  readonly file: ReceivedFile | null;
  /** Why the submission could not be read as one, when it could not. */
  readonly unreadable: string | null;
  /** Reads the working copy. */
  content(): Promise<Buffer>;
  /** Removes the working copy, if there is one. Safe to call more than once. */
  discard(): Promise<void>;
}

/**
 * Reads a multipart submission to its end. Only the first file part is kept; any further file
 * parts, and their bytes, are passed over (R-8.2). A file larger than the limit is cut short at
 * one byte past it, and the rest of the submission is still read, so that the answer reaches a
 * caller that is still sending.
 */
export function receiveUpload(
  request: IncomingMessage,
  directory: string,
  limit: number = FILE_SIZE_LIMIT_BYTES,
): Promise<ReceivedUpload> {
  return new Promise((resolve) => {
    const fields: Record<string, string> = {};
    let file: ReceivedFile | null = null;
    let writing: Promise<void> = Promise.resolve();
    let settled = false;

    const make = (unreadable: string | null): ReceivedUpload => {
      const kept = file;
      return {
        fields,
        file: kept,
        unreadable,
        content: () => (kept ? readFile(kept.path) : Promise.resolve(Buffer.alloc(0))),
        discard: async () => {
          if (kept) await rm(kept.path, { force: true });
        },
      };
    };
    const finish = (unreadable: string | null) => {
      if (settled) return;
      settled = true;
      void writing.then(
        () => resolve(make(unreadable)),
        () => resolve(make("The file could not be received.")),
      );
    };

    let parser: busboy.Busboy;
    try {
      parser = busboy({
        headers: request.headers,
        // One past the limit, so a file exactly at the limit is accepted and one byte more is not.
        limits: { fileSize: limit + 1, fields: 20, fieldSize: 64 * 1024 },
      });
    } catch {
      // Not a multipart submission at all: there is no file part in it.
      request.resume();
      request.on("end", () => finish(null));
      request.on("error", () => finish(null));
      return;
    }

    parser.on("field", (name, value) => {
      if (!(name in fields)) fields[name] = value;
    });

    parser.on("file", (_name, stream) => {
      if (file) {
        stream.resume();
        return;
      }
      const path = join(directory, `${randomUUID()}.upload`);
      const record = { path, size: 0, tooLarge: false };
      file = record;
      const out = createWriteStream(path);
      stream.on("data", (chunk: Buffer) => {
        record.size += chunk.length;
      });
      stream.on("limit", () => {
        record.tooLarge = true;
      });
      // A part cut off by a broken submission still closes its working copy.
      stream.on("error", () => out.end());
      writing = new Promise<void>((done, fail) => {
        out.on("finish", () => done());
        out.on("error", fail);
      });
      stream.pipe(out);
    });

    parser.on("close", () => finish(null));
    parser.on("error", () => {
      // The rest of the request is still read, so the answer is not cut off mid-send.
      request.unpipe(parser);
      request.resume();
      finish("The submission could not be read as a form with a file in it.");
    });
    request.pipe(parser);
  });
}
