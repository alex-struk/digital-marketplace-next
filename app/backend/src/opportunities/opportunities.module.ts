import { Module } from "@nestjs/common";
import { FileStoreModule } from "../files/file-store.module";
import { FilesService } from "../files/files.service";
import { AccountsService } from "../users/accounts.service";
import { UsersModule } from "../users/users.module";
import { OPPORTUNITY_VIEWERS, CwuOpportunitiesController } from "./cwu-opportunities.controller";
import { ATTACHMENT_ACCESS, CLOCK, CwuOpportunitiesService } from "./cwu-opportunities.service";
import { CWU_OPPORTUNITY_STORE } from "./cwu-opportunity";
import { PrismaCwuOpportunityStore } from "./prisma-cwu-opportunity.store";

/** Opportunities: Code With Us so far. */
@Module({
  imports: [UsersModule, FileStoreModule],
  controllers: [CwuOpportunitiesController],
  providers: [
    CwuOpportunitiesService,
    { provide: CWU_OPPORTUNITY_STORE, useClass: PrismaCwuOpportunityStore },
    // A file may be attached only by someone who may read it (R-8.22).
    { provide: ATTACHMENT_ACCESS, useExisting: FilesService },
    // What a person may do is their account's kind, while the account is active (decision record
    // 0001, departure 2).
    { provide: OPPORTUNITY_VIEWERS, useExisting: AccountsService },
    { provide: CLOCK, useValue: () => new Date() },
  ],
})
export class OpportunitiesModule {}
