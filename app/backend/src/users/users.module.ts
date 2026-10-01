import { Module } from "@nestjs/common";
import { signInFlowSettingsFrom } from "../auth/sign-in-flow";
import { FileStoreModule } from "../files/file-store.module";
import { FilesService } from "../files/files.service";
import { ACCOUNT_STORE, PICTURE_ACCESS } from "./account";
import { AccountsService } from "./accounts.service";
import { ContactListController } from "./contact-list.controller";
import { PrismaAccountStore } from "./prisma-account.store";
import { SessionEnding } from "./session-ending";
import { SessionsController } from "./sessions.controller";
import { SIGN_IN_FLOW, SignInController } from "./sign-in.controller";
import { UsersController } from "./users.controller";

@Module({
  imports: [FileStoreModule],
  controllers: [SessionsController, UsersController, ContactListController, SignInController],
  providers: [
    AccountsService,
    SessionEnding,
    { provide: ACCOUNT_STORE, useClass: PrismaAccountStore },
    // A profile picture is a stored file the person may read (R-4.27, R-8.28).
    { provide: PICTURE_ACCESS, useExisting: FilesService },
    // Read once at start-up. With no realm configured, every sign-in ends at the failure notice.
    { provide: SIGN_IN_FLOW, useFactory: () => signInFlowSettingsFrom(process.env) },
  ],
  exports: [AccountsService],
})
export class UsersModule {}
