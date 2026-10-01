import { Controller, Get, Inject, Param, Post, Query, Req, Res } from "@nestjs/common";
import type { Response } from "express";
import { IdentifiedRequest } from "../auth/bearer-token";
import { contentTypeForName } from "../rules/files";
import { AccountsService } from "../users/accounts.service";
import { FileRecord, asFileRecord } from "./file";
import { FilesService, UploadKind } from "./files.service";
import { UPLOADS_DIRECTORY, receiveUpload } from "./upload";

/**
 * How a file is offered for saving: as an attachment, under its stored name (R-8.10). The plain
 * `filename` carries the name with anything outside printable ASCII replaced; `filename*`
 * carries it exactly.
 */
export function dispositionFor(name: string): string {
  const plain = name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  const exact = encodeURIComponent(name).replace(/['()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${plain}"; filename*=UTF-8''${exact}`;
}

/**
 * `/api/files` and `/api/avatars`, the contract's createFile, readFile and createAvatar.
 *
 * An upload is a multipart form, which the boundary hands on unread (decision record 0021):
 * it is read here, into the working directory, checked against what the contract and the
 * criteria say it carries, and the working copy removed once it has been answered.
 */
@Controller("api")
export class FilesController {
  constructor(
    private readonly files: FilesService,
    private readonly accounts: AccountsService,
    @Inject(UPLOADS_DIRECTORY) private readonly directory: string,
  ) {}

  /** Any signed-in person may upload a file; a visitor may not (R-8.1). */
  @Post("files")
  createFile(@Req() request: IdentifiedRequest): Promise<FileRecord> {
    return this.upload(request, "file");
  }

  /** A profile picture or an organization logo (R-8.13, R-8.21, R-8.28, R-8.30). */
  @Post("avatars")
  createAvatar(@Req() request: IdentifiedRequest): Promise<FileRecord> {
    return this.upload(request, "picture");
  }

  /**
   * A file's description, or its content when `type=blob` is asked for, under the same rules
   * (R-8.10, R-8.11, R-8.12).
   */
  @Get("files/:id")
  async read(
    @Param("id") id: string,
    @Query("type") type: string | undefined,
    @Req() request: IdentifiedRequest,
    @Res() response: Response,
  ): Promise<void> {
    const reader = await this.accounts.readingAccount(request.identity);
    const file = await this.files.read(id, reader);
    if (type !== "blob") {
      response.status(200).json(asFileRecord(file));
      return;
    }
    const content = await this.files.content(file);
    response
      .status(200)
      .set({
        "Content-Type": contentTypeForName(file.name),
        "Content-Disposition": dispositionFor(file.name),
        "Content-Length": String(content.length),
        "X-Content-Type-Options": "nosniff",
      })
      .end(content);
  }

  private async upload(request: IdentifiedRequest, kind: UploadKind): Promise<FileRecord> {
    let uploader;
    try {
      uploader = await this.accounts.actingAccount(request.identity);
    } catch (error) {
      // Refused before anything is read; the rest of the submission is let through unread.
      request.resume();
      throw error;
    }
    const upload = await receiveUpload(request, this.directory);
    try {
      return await this.files.store(upload, uploader, kind);
    } finally {
      await upload.discard();
    }
  }
}
