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
import { OtherProgramOpportunitiesController } from "./other-program-opportunities.controller";
import { INDIVIDUAL_EVALUATION_STORE } from "../evaluations/individual-evaluation";
import { IndividualEvaluationsController } from "../evaluations/individual-evaluations.controller";
import { IndividualEvaluationsService } from "../evaluations/individual-evaluations.service";
import { PrismaIndividualEvaluationStore } from "../evaluations/prisma-individual-evaluation.store";
import { CONSENSUS_STORE } from "../evaluations/consensus";
import { ConsensusController } from "../evaluations/consensus.controller";
import { ConsensusService } from "../evaluations/consensus.service";
import { PrismaConsensusStore } from "../evaluations/prisma-consensus.store";
import { TEAM_PROPOSAL_STORE } from "../proposals/team-proposal";
import { PrismaTeamProposalStore } from "../proposals/prisma-team-proposal.store";

/** Opportunities in all three programs, and the evaluation of Sprint With Us and Team With Us ones' questions. */
@Module({
  imports: [UsersModule, FileStoreModule, WatchingModule],
  controllers: [
    CwuOpportunitiesController,
    OtherProgramOpportunitiesController,
    OtherProgramListsController,
    MetricsController,
    IndividualEvaluationsController,
    ConsensusController,
  ],
  providers: [
    CwuOpportunitiesService,
    OtherProgramsService,
    MetricsService,
    OpportunityRunningService,
    IndividualEvaluationsService,
    { provide: INDIVIDUAL_EVALUATION_STORE, useClass: PrismaIndividualEvaluationStore },
    ConsensusService,
    { provide: CONSENSUS_STORE, useClass: PrismaConsensusStore },
    { provide: CWU_OPPORTUNITY_STORE, useClass: PrismaCwuOpportunityStore },
    { provide: OPPORTUNITY_RECORDS_STORE, useClass: PrismaOpportunityRecordsStore },
    { provide: OTHER_PROGRAMS_STORE, useClass: PrismaOtherProgramsStore },
    // Where the proponents of a Sprint With Us opportunity stand, for starting its team scenario (R-1.42).
    { provide: TEAM_PROPOSAL_STORE, useClass: PrismaTeamProposalStore },
    // A file may be attached only by someone who may read it (R-8.22).
    { provide: ATTACHMENT_ACCESS, useExisting: FilesService },
    // What a person may do is their account's kind, while the account is active (decision record
    // 0001, departure 2).
    { provide: OPPORTUNITY_VIEWERS, useExisting: AccountsService },
    { provide: CLOCK, useValue: () => new Date() },
  ],
})
export class OpportunitiesModule {}
