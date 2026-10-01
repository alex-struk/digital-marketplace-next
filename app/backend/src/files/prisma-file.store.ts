import { createHash, randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AccountKind } from "../rules/users";
import { FileGrants } from "../rules/files";
import { FileStore, NewFile, ReadAccessNamesNobody, StoredFile } from "./file";

interface FileRow {
  id: string;
  name: string;
  createdAt: Date;
  createdBy: string | null;
  fileBlob: string;
}

const asStoredFile = (row: FileRow): StoredFile => ({
  id: row.id,
  name: row.name,
  createdAt: row.createdAt.toISOString(),
  createdBy: row.createdBy,
  fileBlob: row.fileBlob,
});

/** The fingerprint of a file's content: a digest of the bytes alone, never the name (R-8.5). */
export function fingerprintOf(content: Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Files as the kept schema holds them: the bytes in `fileBlobs`, keyed by their fingerprint, so
 * identical content is held once; each upload's record in `files`; and who may read it in the
 * three `filePermissions*` tables (R-8.5, R-8.7).
 */
@Injectable()
export class PrismaFileStore implements FileStore {
  constructor(private readonly prisma: PrismaService) {}

  async create(file: NewFile): Promise<StoredFile> {
    const hash = fingerprintOf(file.content);
    const id = randomUUID();
    const named = file.access.flatMap((access) => (access.tag === "user" ? [access.value] : []));
    if (named.length > 0) {
      const found = await this.prisma.users.count({ where: { id: { in: named } } });
      if (found !== named.length) throw new ReadAccessNamesNobody();
    }
    const row = await this.prisma.$transaction(async (tx) => {
      // Content already held under this fingerprint is kept as it is; only the record is new.
      await tx.fileBlobs.upsert({
        where: { hash },
        create: { hash, blob: new Uint8Array(file.content) },
        update: {},
      });
      const created = await tx.files.create({
        data: {
          id,
          name: file.name,
          createdAt: new Date(),
          createdBy: file.createdBy,
          fileBlob: hash,
        },
      });
      for (const access of file.access) {
        if (access.tag === "any") {
          await tx.filePermissionsPublic.create({ data: { file: id } });
        } else if (access.tag === "user") {
          await tx.filePermissionsUser.create({ data: { file: id, user: access.value } });
        } else {
          await tx.filePermissionsUserType.create({ data: { file: id, userType: access.value } });
        }
      }
      return created;
    });
    return asStoredFile(row);
  }

  async find(id: string): Promise<{ file: StoredFile; grants: FileGrants } | null> {
    const row = await this.prisma.files.findUnique({
      where: { id },
      include: {
        filePermissionsPublic: true,
        filePermissionsUser: true,
        filePermissionsUserType: true,
      },
    });
    if (!row) return null;
    return {
      file: asStoredFile(row),
      grants: {
        createdBy: row.createdBy,
        public: row.filePermissionsPublic !== null,
        users: row.filePermissionsUser.map((grant) => grant.user),
        userTypes: row.filePermissionsUserType.map((grant) => grant.userType as AccountKind),
      },
    };
  }

  async content(fileBlob: string): Promise<Buffer | null> {
    const row = await this.prisma.fileBlobs.findUnique({ where: { hash: fileBlob } });
    return row ? Buffer.from(row.blob) : null;
  }
}
