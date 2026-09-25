import { Module } from "@nestjs/common";
import { ContentModule } from "./content/content.module";
import { PrismaModule } from "./prisma/prisma.module";
import { StatusController } from "./status/status.controller";

@Module({
  imports: [PrismaModule, ContentModule],
  controllers: [StatusController],
})
export class AppModule {}
