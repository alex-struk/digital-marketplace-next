import { Module } from "@nestjs/common";
import { OPPORTUNITY_VIEWERS } from "../opportunities/cwu-opportunities.controller";
import { AccountsService } from "../users/accounts.service";
import { UsersModule } from "../users/users.module";
import { WatchingModule } from "../watching/watching.module";
import { COUNTER_STORE } from "./counters";
import { CountersController } from "./counters.controller";
import { CountersService } from "./counters.service";
import { PrismaCounterStore } from "./prisma-counter.store";

/** The counts behind an opportunity's reporting figures. */
@Module({
  imports: [UsersModule, WatchingModule],
  controllers: [CountersController],
  providers: [
    CountersService,
    { provide: COUNTER_STORE, useClass: PrismaCounterStore },
    { provide: OPPORTUNITY_VIEWERS, useExisting: AccountsService },
  ],
})
export class CountersModule {}
