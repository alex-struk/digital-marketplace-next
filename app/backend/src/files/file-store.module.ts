import { Module } from "@nestjs/common";
import { CwuAttachmentReadPath } from "../opportunities/cwu-attachment-read-path";
import { FILE_READ_PATHS, FILE_STORE, FileReadPath } from "./file";
import { FilesService } from "./files.service";
import { PrismaFileStore } from "./prisma-file.store";

/**
 * The file store: storing files and deciding who may read them. Other modules use
 * `FilesService` to check a file a record names; nothing else touches the tables.
 */
@Module({
  providers: [
    FilesService,
    { provide: FILE_STORE, useClass: PrismaFileStore },
    // What a file is attached to can make it readable (R-8.20): a Code With Us opportunity, so
    // far (R-8.25). Each slice that attaches files to something else adds its own path here.
    CwuAttachmentReadPath,
    {
      provide: FILE_READ_PATHS,
      inject: [CwuAttachmentReadPath],
      useFactory: (codeWithUs: CwuAttachmentReadPath): readonly FileReadPath[] => [codeWithUs],
    },
  ],
  exports: [FilesService],
})
export class FileStoreModule {}
