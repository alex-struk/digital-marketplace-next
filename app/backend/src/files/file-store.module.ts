import { Module } from "@nestjs/common";
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
    // What a file is attached to can make it readable (R-8.20). No slice before the one that
    // attaches files to opportunities has anything to add here.
    { provide: FILE_READ_PATHS, useValue: [] as readonly FileReadPath[] },
  ],
  exports: [FilesService],
})
export class FileStoreModule {}
