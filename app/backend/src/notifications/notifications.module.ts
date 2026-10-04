import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { UsersModule } from "../users/users.module";
import { EmailNotificationsController } from "./email-notifications.controller";
import { EmailReferenceController } from "./email-reference.controller";
import { PrismaTermsStore } from "./prisma-terms.store";
import { TERMS_STORE, TermsAnnouncement } from "./terms-announcement";

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [EmailNotificationsController, EmailReferenceController],
  providers: [TermsAnnouncement, { provide: TERMS_STORE, useClass: PrismaTermsStore }],
})
export class NotificationsModule {}
