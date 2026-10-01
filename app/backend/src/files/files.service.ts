import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  FILE_TOO_LARGE_MESSAGE,
  FileReader,
  IMAGE_CONTENT_MESSAGE,
  IMAGE_ENDING_MESSAGE,
  ReadAccess,
  fileNameError,
  hasImageEnding,
  isIdentifier,
  mayReadByGrants,
  readAccessFrom,
} from "../rules/files";
import {
  FILE_READ_PATHS,
  FILE_STORE,
  FileReadPath,
  FileRecord,
  FileStore,
  ReadAccessNamesNobody,
  StoredFile,
  asFileRecord,
} from "./file";
import { preparePicture } from "./images";
import { ReceivedUpload } from "./upload";

/** What an upload is for: any file, or a profile picture or logo (R-8.13, R-8.21, R-8.30). */
export type UploadKind = "file" | "picture";

export const NO_FILE_PART =
  "The submission carried no file. Send the file to store as a file part of the form.";
export const NOT_AUTHORIZED_TO_READ = "You are not authorized to read this file.";
export const FILE_NOT_FOUND = "No file is held at that address.";

/** Everybody may read a picture or a logo, signed in or not (R-8.28). */
const READABLE_BY_ANYONE: ReadAccess = { tag: "any" };

/**
 * Storing files and deciding who may read them.
 *
 * Every refusal of an upload is the requester's own error and is answered as one, naming what
 * was wrong, never as a fault of the service (R-8.17, R-8.18, R-8.23, R-8.24). Nothing is stored
 * when an upload is refused.
 */
@Injectable()
export class FilesService {
  constructor(
    @Inject(FILE_STORE) private readonly files: FileStore,
    @Inject(FILE_READ_PATHS) private readonly readPaths: readonly FileReadPath[],
  ) {}

  /** Stores what a signed-in person uploaded (R-8.1, R-8.2) and answers with its record. */
  async store(upload: ReceivedUpload, uploader: FileReader, kind: UploadKind): Promise<FileRecord> {
    if (upload.unreadable) throw new BadRequestException(upload.unreadable);
    if (!upload.file) throw new BadRequestException(NO_FILE_PART);
    if (upload.file.tooLarge) throw new PayloadTooLargeException(FILE_TOO_LARGE_MESSAGE);

    const name = upload.fields.name ?? "";
    const nameError = fileNameError(name);
    if (nameError) throw new BadRequestException(nameError);

    let access: readonly ReadAccess[];
    if (kind === "picture") {
      // A picture may say who reads it, as any upload does, and is readable by anyone whatever
      // it says (R-8.28).
      if (upload.fields.metadata !== undefined) {
        const reading = readAccessFrom(upload.fields.metadata);
        if (!reading.ok) throw new BadRequestException(reading.message);
      }
      access = [READABLE_BY_ANYONE];
    } else {
      const reading = readAccessFrom(upload.fields.metadata);
      if (!reading.ok) throw new BadRequestException(reading.message);
      access = reading.access;
    }

    let content = await upload.content();
    if (kind === "picture") {
      if (!hasImageEnding(name)) throw new BadRequestException(IMAGE_ENDING_MESSAGE);
      const picture = preparePicture(content);
      if (!picture.ok) throw new BadRequestException(IMAGE_CONTENT_MESSAGE);
      content = picture.content;
    }

    try {
      const stored = await this.files.create({ name, createdBy: uploader.id, content, access });
      return asFileRecord(stored);
    } catch (error) {
      if (error instanceof ReadAccessNamesNobody) {
        throw new BadRequestException(
          "The read-access information provided was invalid: it names a person who has no account.",
        );
      }
      throw error;
    }
  }

  /**
   * A stored file, for someone who may read it (R-8.7, R-8.20), with its content when asked for
   * (R-8.10, R-8.11).
   *
   * A file the requester may not read and a file that does not exist are both answered as not
   * authorized, so the answer does not say which identifiers are held — except to an
   * administrator, who may read every file and is told when there is none (R-8.12). A malformed
   * identifier is answered the same way as one no file carries.
   */
  async read(id: string, reader: FileReader | null): Promise<StoredFile> {
    const found = isIdentifier(id) ? await this.files.find(id.toLowerCase()) : null;
    if (!found) {
      if (reader?.type === "ADMIN") throw new NotFoundException(FILE_NOT_FOUND);
      throw new UnauthorizedException(NOT_AUTHORIZED_TO_READ);
    }
    if (mayReadByGrants(found.grants, reader)) return found.file;
    for (const path of this.readPaths) {
      if (await path.mayRead(found.file.id, reader)) return found.file;
    }
    throw new UnauthorizedException(NOT_AUTHORIZED_TO_READ);
  }

  /** The content a file names. */
  async content(file: StoredFile): Promise<Buffer> {
    const content = await this.files.content(file.fileBlob);
    if (!content) throw new Error("A stored file's content is missing.");
    return content;
  }

  /** Whether a person may read a file, for a record that names one (R-8.22). */
  async mayRead(id: string, reader: FileReader | null): Promise<boolean> {
    try {
      await this.read(id, reader);
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) return false;
      throw error;
    }
  }
}
