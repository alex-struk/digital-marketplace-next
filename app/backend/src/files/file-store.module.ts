import { Module } from "@nestjs/common";
import { CwuAttachmentReadPath } from "../opportunities/cwu-attachment-read-path";
import { NoteAttachmentReadPath } from "../opportunities/note-attachment-read-path";
import { ProposalAttachmentReadPath } from "../proposals/proposal-attachment-read-path";
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
    // What a file is attached to can make it readable (R-8.20): a Code With Us opportunity
    // (R-8.25), a private note on an opportunity's history (R-1.33), and a proposal in any program
    // that attaches files to one. Each slice that attaches files to something else adds its own
    // path here.
    CwuAttachmentReadPath,
    NoteAttachmentReadPath,
    ProposalAttachmentReadPath,
    {
      provide: FILE_READ_PATHS,
      inject: [CwuAttachmentReadPath, NoteAttachmentReadPath, ProposalAttachmentReadPath],
      useFactory: (
        codeWithUs: CwuAttachmentReadPath,
        notes: NoteAttachmentReadPath,
        proposals: ProposalAttachmentReadPath,
      ): readonly FileReadPath[] => [codeWithUs, notes, proposals],
    },
  ],
  exports: [FilesService],
})
export class FileStoreModule {}
