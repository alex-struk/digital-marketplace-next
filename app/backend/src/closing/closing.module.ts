import { Module } from "@nestjs/common";
import { CLOCK } from "../opportunities/cwu-opportunities.service";
import { CLOSING_INTERVAL, CLOSING_STORE, closingIntervalFrom } from "./closing";
import { DeadlineClosing } from "./deadline-closing.service";
import { PrismaClosingStore } from "./prisma-closing.store";

/** Opportunities closing at their proposal deadline, in front of /api and /status (decision record 0005). */
@Module({
  providers: [
    DeadlineClosing,
    { provide: CLOSING_STORE, useClass: PrismaClosingStore },
    { provide: CLOSING_INTERVAL, useFactory: () => closingIntervalFrom(process.env) },
    { provide: CLOCK, useValue: () => new Date() },
  ],
  exports: [DeadlineClosing],
})
export class ClosingModule {}
