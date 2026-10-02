import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import {
  NOT_PERMITTED_TO_CREATE,
  NO_OPPORTUNITY_THERE,
  ONLY_ADMINISTRATORS_PUBLISH,
  OpportunityViewer,
  mayReadOpportunity,
  maySeeAuthorship,
  pacificDayOf,
} from "../rules/opportunities";
import {
  UNKNOWN_CREATION_STATE,
  creationDecision,
  draftOf,
  isCreationRefusal,
  remoteWorkProblems,
} from "../rules/other-program-drafts";
import { WatchingService } from "../watching/watching.service";
import { CLOCK, Clock } from "./cwu-opportunities.service";
import {
  OTHER_PROGRAMS_STORE,
  OtherProgram,
  OtherProgramsStore,
  StoredDetails,
  StoredSummary,
  SummaryAnswer,
} from "./other-programs";

/**
 * Sprint With Us and Team With Us opportunities until slice 10: every one the person may read —
 * published ones to anyone, unpublished ones to their author and administrators (R-1.2, R-1.3) —
 * with whether the person watches it (R-1.5), and a new one created as a draft, under review or,
 * by an administrator, published (R-1.7, R-1.9, R-1.48; decision records 0035 and 0036).
 */
@Injectable()
export class OtherProgramsService {
  constructor(
    @Inject(OTHER_PROGRAMS_STORE) private readonly store: OtherProgramsStore,
    private readonly watching: WatchingService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async list(viewer: OpportunityViewer | null, program: OtherProgram): Promise<SummaryAnswer[]> {
    const [all, watched] = await Promise.all([this.store.list(program), this.watching.watchedBy(viewer, program)]);
    return all
      .filter((opportunity) => mayReadOpportunity(viewer, standingOf(opportunity)))
      .map((opportunity) => summaryAnswerFor(opportunity, viewer, watched.has(opportunity.id)));
  }

  /** One opportunity, for someone who may read it; one they may not is answered as one not there (R-1.2). */
  async read(viewer: OpportunityViewer | null, program: OtherProgram, id: string): Promise<SummaryAnswer> {
    const found = await this.store.find(program, id.toLowerCase());
    if (!found || !mayReadOpportunity(viewer, standingOf(found))) throw new NotFoundException(NO_OPPORTUNITY_THERE);
    const watched = await this.watching.watchedBy(viewer, program);
    return summaryAnswerFor(found, viewer, watched.has(found.id));
  }

  async create(viewer: OpportunityViewer | null, program: OtherProgram, body: unknown): Promise<SummaryAnswer> {
    const decision = creationDecision(viewer, body);
    if (isCreationRefusal(decision)) {
      if (decision.kind === "not-permitted") throw new UnauthorizedException(NOT_PERMITTED_TO_CREATE);
      if (decision.kind === "only-administrators-publish") throw new UnauthorizedException(ONLY_ADMINISTRATORS_PUBLISH);
      throw new BadRequestException([UNKNOWN_CREATION_STATE]);
    }
    const problems = remoteWorkProblems(decision, body);
    if (problems.length > 0) throw new BadRequestException(problems);
    const author = viewer as OpportunityViewer;
    const id = await this.store.create(program, draftOf(program, body, pacificDayOf(this.clock())), decision, author.id);
    return this.read(author, program, id);
  }
}

function standingOf(opportunity: StoredSummary) {
  return { status: opportunity.status, createdBy: opportunity.createdBy?.id ?? null };
}

/** An opportunity as the person asking is answered with it; authorship as R-1.29 allows. */
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
    description: opportunity.description,
    proposalDeadline: opportunity.proposalDeadline,
    assignmentDate: opportunity.assignmentDate,
    ...(opportunity.program === "sprint-with-us"
      ? { totalMaxBudget: opportunity.budget }
      : { startDate: opportunity.startDate ?? opportunity.assignmentDate, completionDate: opportunity.completionDate, maxBudget: opportunity.budget }),
    subscribed,
    ...(opportunity.details ? programContentOf(opportunity.program, opportunity.details) : {}),
  };
}

/** What a program holds, under the names the old service gave it. */
function programContentOf(program: OtherProgram, details: StoredDetails): Partial<SummaryAnswer> {
  const numbered = <T>(items: readonly T[]) => items.map((item, order) => ({ ...item, order }));
  const phase = (kind: string) => details.phases.find((entry) => entry.phase === kind) ?? null;
  const shared = {
    questionsWeight: details.weights.questions,
    priceWeight: details.weights.price,
    evaluationPanel: numbered(details.panel),
  };
  return program === "sprint-with-us"
    ? {
        ...shared,
        mandatorySkills: details.skills,
        inceptionPhase: phase("INCEPTION"),
        prototypePhase: phase("PROTOTYPE"),
        implementationPhase: phase("IMPLEMENTATION"),
        teamQuestions: numbered(details.questions),
        codeChallengeWeight: details.weights.codeChallenge,
        scenarioWeight: details.weights.scenario,
      }
    : {
        ...shared,
        resources: numbered(details.resources),
        resourceQuestions: numbered(details.questions),
        challengeWeight: details.weights.challenge,
      };
}
