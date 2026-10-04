import { Module } from "@nestjs/common";
import { FileStoreModule } from "../files/file-store.module";
import { FilesService } from "../files/files.service";
import { ATTACHMENT_ACCESS } from "../opportunities/attachment-access";
import { CLOCK } from "../opportunities/cwu-opportunities.service";
import { UsersModule } from "../users/users.module";
import { CWU_PROPOSAL_STORE } from "./cwu-proposal";
import { CwuProposalsController } from "./cwu-proposals.controller";
import { CwuProposalsService } from "./cwu-proposals.service";
import { PrismaCwuProposalStore } from "./prisma-cwu-proposal.store";
import { PrismaTeamProposalStore } from "./prisma-team-proposal.store";
import { TEAM_PROPOSAL_STORE } from "./team-proposal";
import { SwuProposalsController, TwuProposalsController } from "./team-proposals.controller";
import { TeamProposalsService } from "./team-proposals.service";

/** Proposals in all three programs. */
@Module({
  imports: [UsersModule, FileStoreModule],
  controllers: [CwuProposalsController, SwuProposalsController, TwuProposalsController],
  providers: [
    CwuProposalsService,
    TeamProposalsService,
    { provide: CWU_PROPOSAL_STORE, useClass: PrismaCwuProposalStore },
    { provide: TEAM_PROPOSAL_STORE, useClass: PrismaTeamProposalStore },
    // A file may be attached only by someone who may read it (R-8.22).
    { provide: ATTACHMENT_ACCESS, useExisting: FilesService },
    { provide: CLOCK, useValue: () => new Date() },
  ],
})
export class ProposalsModule {}
