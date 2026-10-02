import { Module } from "@nestjs/common";
import { FileStoreModule } from "../files/file-store.module";
import { FilesService } from "../files/files.service";
import { AccountsService } from "../users/accounts.service";
import { UsersModule } from "../users/users.module";
import { WatchingModule } from "../watching/watching.module";
import { OPPORTUNITY_VIEWERS, CwuOpportunitiesController } from "./cwu-opportunities.controller";
import { ATTACHMENT_ACCESS, CLOCK, CwuOpportunitiesService } from "./cwu-opportunities.service";
import { CWU_OPPORTUNITY_STORE } from "./cwu-opportunity";
import { MetricsService } from "./metrics.service";
import { OPPORTUNITY_RECORDS_STORE } from "./opportunity-records";
import { OpportunityRunningService } from "./opportunity-running.service";
import { PrismaOpportunityRecordsStore } from "./prisma-opportunity-records.store";
import { OTHER_PROGRAMS_STORE } from "./other-programs";
import { MetricsController, OtherProgramListsController } from "./other-programs.controller";
import { OtherProgramsService } from "./other-programs.service";
import { PrismaCwuOpportunityStore } from "./prisma-cwu-opportunity.store";
import { PrismaOtherProgramsStore } from "./prisma-other-programs.store";
import { UnbuiltProgramCreationController } from "./unbuilt-program-creation.controller";

/** Opportunities: Code With Us, and the list of the other two programs'. */
@Module({
  imports: [UsersModule, FileStoreModule, WatchingModule],
  controllers: [CwuOpportunitiesController, UnbuiltProgramCreationController, OtherProgramListsController, MetricsController],
  providers: [
    CwuOpportunitiesService,
    OtherProgramsService,
    MetricsService,
    OpportunityRunningService,
    { provide: CWU_OPPORTUNITY_STORE, useClass: PrismaCwuOpportunityStore },
    { provide: OPPORTUNITY_RECORDS_STORE, useClass: PrismaOpportunityRecordsStore },
    { provide: OTHER_PROGRAMS_STORE, useClass: PrismaOtherProgramsStore },
    // A file may be attached only by someone who may read it (R-8.22).
    { provide: ATTACHMENT_ACCESS, useExisting: FilesService },
    // What a person may do is their account's kind, while the account is active (decision record
    // 0001, departure 2).
    { provide: OPPORTUNITY_VIEWERS, useExisting: AccountsService },
    { provide: CLOCK, useValue: () => new Date() },
  ],
})
export class OpportunitiesModule {}
