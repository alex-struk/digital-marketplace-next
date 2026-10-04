import { Module } from "@nestjs/common";
import { NoteAttachmentReadPath } from "../opportunities/note-attachment-read-path";
import { OpportunityAttachmentReadPath } from "../opportunities/opportunity-attachment-read-path";
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
    // What a file is attached to can make it readable (R-8.20): an opportunity in any of the three
    // programs (R-8.25), a private note on an opportunity's history (R-1.33), and a proposal in any
    // of the three programs — each by one rule for every program. Each slice that attaches files to
    // something else adds its own path here.
    OpportunityAttachmentReadPath,
    NoteAttachmentReadPath,
    ProposalAttachmentReadPath,
    {
      provide: FILE_READ_PATHS,
      inject: [OpportunityAttachmentReadPath, NoteAttachmentReadPath, ProposalAttachmentReadPath],
      useFactory: (
        opportunities: OpportunityAttachmentReadPath,
        notes: NoteAttachmentReadPath,
        proposals: ProposalAttachmentReadPath,
      ): readonly FileReadPath[] => [opportunities, notes, proposals],
    },
  ],
  exports: [FilesService],
})
export class FileStoreModule {}
