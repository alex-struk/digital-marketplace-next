import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AccountsService } from "./accounts.service";
import { PrismaUserStore } from "./prisma-user.store";
import { USER_STORE } from "./user";
import { UsersController } from "./users.controller";

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [AccountsService, { provide: USER_STORE, useClass: PrismaUserStore }],
  exports: [AccountsService, USER_STORE],
})
export class UsersModule {}
