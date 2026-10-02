import { Module } from "@nestjs/common";
import { CwuAttachmentReadPath } from "../opportunities/cwu-attachment-read-path";
import { NoteAttachmentReadPath } from "../opportunities/note-attachment-read-path";
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
    // far (R-8.25), and a private note on an opportunity's history (R-1.33). Each slice that
    // attaches files to something else adds its own path here.
    CwuAttachmentReadPath,
    NoteAttachmentReadPath,
    {
      provide: FILE_READ_PATHS,
      inject: [CwuAttachmentReadPath, NoteAttachmentReadPath],
      useFactory: (codeWithUs: CwuAttachmentReadPath, notes: NoteAttachmentReadPath): readonly FileReadPath[] => [
        codeWithUs,
        notes,
      ],
    },
  ],
  exports: [FilesService],
})
export class FileStoreModule {}
