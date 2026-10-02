import { Module } from "@nestjs/common";
import { OPPORTUNITY_VIEWERS } from "../opportunities/cwu-opportunities.controller";
import { AccountsService } from "../users/accounts.service";
import { UsersModule } from "../users/users.module";
import { PrismaWatchStore } from "./prisma-watch.store";
import { SubscribersController } from "./subscribers.controller";
import { WATCH_CLOCK, WATCH_STORE } from "./watching";
import { WatchingService } from "./watching.service";

/** Watching opportunities, in all three programs. */
@Module({
  imports: [UsersModule],
  controllers: [SubscribersController],
  providers: [
    WatchingService,
    { provide: WATCH_STORE, useClass: PrismaWatchStore },
    { provide: OPPORTUNITY_VIEWERS, useExisting: AccountsService },
    { provide: WATCH_CLOCK, useValue: () => new Date() },
  ],
  exports: [WatchingService, WATCH_STORE],
})
export class WatchingModule {}
