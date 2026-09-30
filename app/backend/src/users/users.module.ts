import { Module } from "@nestjs/common";
import { signInFlowSettingsFrom } from "../auth/sign-in-flow";
import { ACCOUNT_STORE } from "./account";
import { AccountsService } from "./accounts.service";
import { PrismaAccountStore } from "./prisma-account.store";
import { SessionsController } from "./sessions.controller";
import { SIGN_IN_FLOW, SignInController } from "./sign-in.controller";
import { UsersController } from "./users.controller";

@Module({
  controllers: [SessionsController, UsersController, SignInController],
  providers: [
    AccountsService,
    { provide: ACCOUNT_STORE, useClass: PrismaAccountStore },
    // Read once at start-up. With no realm configured, every sign-in ends at the failure notice.
    { provide: SIGN_IN_FLOW, useFactory: () => signInFlowSettingsFrom(process.env) },
  ],
  exports: [AccountsService],
})
export class UsersModule {}
