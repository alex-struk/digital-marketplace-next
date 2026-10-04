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

/** Proposals. Code With Us so far; Sprint With Us and Team With Us arrive in slice 15. */
@Module({
  imports: [UsersModule, FileStoreModule],
  controllers: [CwuProposalsController],
  providers: [
    CwuProposalsService,
    { provide: CWU_PROPOSAL_STORE, useClass: PrismaCwuProposalStore },
    // A file may be attached only by someone who may read it (R-8.22).
    { provide: ATTACHMENT_ACCESS, useExisting: FilesService },
    { provide: CLOCK, useValue: () => new Date() },
  ],
})
export class ProposalsModule {}
