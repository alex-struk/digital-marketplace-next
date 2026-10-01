import { Inject, Injectable } from "@nestjs/common";
import { OpportunityViewer, mayReadOpportunity, maySeeAuthorship } from "../rules/opportunities";
import { WatchingService } from "../watching/watching.service";
import { OTHER_PROGRAMS_STORE, OtherProgram, OtherProgramsStore, StoredSummary, SummaryAnswer } from "./other-programs";

/**
 * Sprint With Us and Team With Us opportunities as the list shows them: every one the person may
 * read — published ones to anyone, unpublished ones to their author and administrators (R-1.2,
 * R-1.3) — with whether the person watches it (R-1.5).
 */
@Injectable()
export class OtherProgramsService {
  constructor(
    @Inject(OTHER_PROGRAMS_STORE) private readonly store: OtherProgramsStore,
    private readonly watching: WatchingService,
  ) {}

  async list(viewer: OpportunityViewer | null, program: OtherProgram): Promise<SummaryAnswer[]> {
    const [all, watched] = await Promise.all([this.store.list(program), this.watching.watchedBy(viewer, program)]);
    return all
      .filter((opportunity) => mayReadOpportunity(viewer, { status: opportunity.status, createdBy: opportunity.createdBy?.id ?? null }))
      .map((opportunity) => summaryAnswerFor(opportunity, viewer, watched.has(opportunity.id)));
  }
}

/** A listed opportunity as the person asking is answered with it; authorship as R-1.29 allows. */
export function summaryAnswerFor(opportunity: StoredSummary, viewer: OpportunityViewer | null, subscribed: boolean): SummaryAnswer {
  const authorship = maySeeAuthorship(viewer, {
    createdBy: opportunity.createdBy?.id ?? null,
    updatedBy: opportunity.updatedBy?.id ?? null,
  });
  return {
    id: opportunity.id,
    program: opportunity.program,
    createdAt: opportunity.createdAt.toISOString(),
    updatedAt: opportunity.updatedAt.toISOString(),
    ...(authorship ? { createdBy: opportunity.createdBy, updatedBy: opportunity.updatedBy } : {}),
    status: opportunity.status,
    publishedAt: opportunity.publishedAt?.toISOString() ?? null,
    title: opportunity.title,
    teaser: opportunity.teaser,
    location: opportunity.location,
    remoteOk: opportunity.remoteOk,
    remoteDesc: opportunity.remoteDesc,
    proposalDeadline: opportunity.proposalDeadline,
    ...(opportunity.program === "sprint-with-us" ? { totalMaxBudget: opportunity.budget } : { maxBudget: opportunity.budget }),
    subscribed,
  };
}
