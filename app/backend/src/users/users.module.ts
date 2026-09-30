import { Module } from "@nestjs/common";
import { ACCOUNT_STORE } from "./account";
import { AccountsService } from "./accounts.service";
import { PrismaAccountStore } from "./prisma-account.store";
import { SessionsController } from "./sessions.controller";
import { UsersController } from "./users.controller";

@Module({
  controllers: [SessionsController, UsersController],
  providers: [
    AccountsService,
    { provide: ACCOUNT_STORE, useClass: PrismaAccountStore },
  ],
  exports: [AccountsService],
})
export class UsersModule {}
