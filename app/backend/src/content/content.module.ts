import { Module } from "@nestjs/common";
import { ContentController, PAGE_VIEWERS } from "./content.controller";
import { ContentService } from "./content.service";
import { PrismaPageStore } from "./prisma-page.store";
import { PAGE_STORE } from "./page";
import { PrismaModule } from "../prisma/prisma.module";
import { AccountsService } from "../users/accounts.service";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [ContentController],
  providers: [
    ContentService,
    { provide: PAGE_STORE, useClass: PrismaPageStore },
    // What a person may do with pages is their account's kind, as the kept `users` table
    // records it, while the account is active (decision record 0001, departure 2).
    { provide: PAGE_VIEWERS, useExisting: AccountsService },
  ],
})
export class ContentModule {}
