import { Module } from "@nestjs/common";
import { FileStoreModule } from "../files/file-store.module";
import { FilesService } from "../files/files.service";
import { UsersModule } from "../users/users.module";
import { LOGO_ACCESS, ORGANIZATION_STORE } from "./organization";
import {
  AffiliationsController,
  OrganizationsController,
  OwnedOrganizationsController,
} from "./organizations.controller";
import { OrganizationsService } from "./organizations.service";
import { PrismaOrganizationStore } from "./prisma-organization.store";

/** Organizations: the list, registering, the profile and archiving (slice 11). */
@Module({
  imports: [UsersModule, FileStoreModule],
  controllers: [OrganizationsController, OwnedOrganizationsController, AffiliationsController],
  providers: [
    OrganizationsService,
    { provide: ORGANIZATION_STORE, useClass: PrismaOrganizationStore },
    // A logo is a stored picture the person may read, as a profile picture is (R-8.28).
    { provide: LOGO_ACCESS, useExisting: FilesService },
  ],
})
export class OrganizationsModule {}
