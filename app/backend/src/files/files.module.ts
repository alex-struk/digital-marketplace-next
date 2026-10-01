import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { FileStoreModule } from "./file-store.module";
import { FilesController } from "./files.controller";
import { UPLOADS_DIRECTORY, uploadsDirectoryFrom } from "./upload";

/** `/api/files` and `/api/avatars`. */
@Module({
  imports: [FileStoreModule, UsersModule],
  controllers: [FilesController],
  providers: [
    // Made when the service starts; one that cannot be made stops it starting (R-8.16).
    { provide: UPLOADS_DIRECTORY, useFactory: () => uploadsDirectoryFrom(process.env) },
  ],
})
export class FilesModule {}
