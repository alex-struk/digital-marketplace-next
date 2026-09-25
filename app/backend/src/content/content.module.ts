import { Module } from "@nestjs/common";
import { ContentController } from "./content.controller";
import { ContentService } from "./content.service";
import { PrismaPageStore } from "./prisma-page.store";
import { PAGE_STORE } from "./page";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ContentController],
  providers: [
    ContentService,
    { provide: PAGE_STORE, useClass: PrismaPageStore },
  ],
})
export class ContentModule {}
