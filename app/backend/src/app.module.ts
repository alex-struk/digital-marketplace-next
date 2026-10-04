import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { ContentModule } from "./content/content.module";
import { FilesModule } from "./files/files.module";
import { MailModule } from "./mail/mail.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { OpportunitiesModule } from "./opportunities/opportunities.module";
import { OrganizationsModule } from "./organizations/organizations.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProposalsModule } from "./proposals/proposals.module";
import { StatusController } from "./status/status.controller";
import { UsersModule } from "./users/users.module";
import { WatchingModule } from "./watching/watching.module";
import { CountersModule } from "./counters/counters.module";
import { ClosingModule } from "./closing/closing.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MailModule,
    ContentModule,
    UsersModule,
    FilesModule,
    NotificationsModule,
    OpportunitiesModule,
    OrganizationsModule,
    ProposalsModule,
    WatchingModule,
    CountersModule,
    ClosingModule,
  ],
  controllers: [StatusController],
})
export class AppModule {}
