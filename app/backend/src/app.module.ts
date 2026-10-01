import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { ContentModule } from "./content/content.module";
import { FilesModule } from "./files/files.module";
import { MailModule } from "./mail/mail.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PrismaModule } from "./prisma/prisma.module";
import { StatusController } from "./status/status.controller";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [PrismaModule, AuthModule, MailModule, ContentModule, UsersModule, FilesModule, NotificationsModule],
  controllers: [StatusController],
})
export class AppModule {}
