import { FileGrants, FileReader, ReadAccess } from "../rules/files";

/**
 * A stored file's record, as the kept `files` table holds it: a name, who stored it and when,
 * and the stored content it names by its fingerprint. Written once and never changed (R-8.6).
 */
export interface StoredFile {
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
  readonly createdBy: string | null;
  /** The fingerprint of the stored content, shared by every upload of the same bytes (R-8.5). */
  readonly fileBlob: string;
}

/**
 * A file's description, as the service answers with it (R-8.11): its identifier, its name, when
 * it was stored and the fingerprint of its content. Who uploaded it is recorded and never
 * answered (spec/contract/observables.yaml, files).
 */
export interface FileRecord {
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
  readonly fileBlob: string;
}

export function asFileRecord(file: StoredFile): FileRecord {
  return { id: file.id, name: file.name, createdAt: file.createdAt, fileBlob: file.fileBlob };
}

export interface NewFile {
  readonly name: string;
  readonly createdBy: string;
  readonly content: Buffer;
  readonly access: readonly ReadAccess[];
}

/** Where stored files are kept. The service is written against this, not against Prisma. */
export interface FileStore {
  /**
   * Stores a file: its content once per distinct fingerprint, and a record of its own with its
   * name, uploader, date and read access (R-8.5, R-8.6).
   */
  create(file: NewFile): Promise<StoredFile>;
  /** A file's record and what was recorded about who may read it. */
  find(id: string): Promise<{ file: StoredFile; grants: FileGrants } | null>;
  /** The stored content a fingerprint names. */
  content(fileBlob: string): Promise<Buffer | null>;
  /**
   * The files no record refers to any longer, oldest first: attached to no current version of an
   * opportunity, no proposal and no note, and nobody's picture or logo. Their content is kept
   * until the records-retention rule for procurement attachments disposes of it (R-8.31).
   */
  detached(): Promise<StoredFile[]>;
}

export const FILE_STORE = Symbol("FileStore");

/** A read-access statement names a person who has no account, so nothing was stored. */
export class ReadAccessNamesNobody extends Error {
  constructor() {
    super("A read-access statement names a person who has no account.");
    this.name = "ReadAccessNamesNobody";
  }
}

/**
 * A way a file becomes readable through what it is attached to (R-8.20) — an opportunity or a
 * proposal. Each later slice that attaches files adds one; a file is readable when any says so.
 */
export interface FileReadPath {
  mayRead(fileId: string, reader: FileReader | null): Promise<boolean>;
}

export const FILE_READ_PATHS = Symbol("FileReadPaths");
