import { BadRequestException, Inject, Injectable, NotFoundException, Optional, UnauthorizedException } from "@nestjs/common";
import { DetailedRefusal } from "../common/refusals";
import { ProposalSubject } from "../mail/notifications/proposal";
import { ProposalNotices } from "./proposal-notices";
import {
  CANNOT_AWARD_NOW,
  CANNOT_DISQUALIFY_NOW,
  CANNOT_SCORE_NOW,
  MOVED_TO_PROCESSING_NOTE,
  NOT_PERMITTED_TO_EVALUATE,
  Rank,
  SCORE_MESSAGE,
  allInContentionEvaluated,
  disqualificationReasonProblem,
  mayAwardInState,
  mayDisqualifyInState,
  mayEvaluateProposal,
  mayScoreInState,
  rankAmong,
  readScore,
} from "../rules/proposal-evaluation";
import { ATTACHMENT_ACCESS, AttachmentAccess } from "../opportunities/attachment-access";
import { CLOCK, Clock } from "../opportunities/cwu-opportunities.service";
import {
  ALREADY_HAVE_PROPOSAL,
  CANNOT_EDIT_NOW,
  CANNOT_SUBMIT_NOW,
  CANNOT_WITHDRAW_NOW,
  CREATABLE_PROPOSAL_STATES,
  CwuProposalInput,
  CwuProposalStatus,
  NOT_ACCEPTING_PROPOSALS,
  NOT_PERMITTED_TO_CHANGE_PROPOSAL,
  NOT_PERMITTED_TO_START,
  NO_OPPORTUNITY_FOR_PROPOSAL,
  NO_PROPOSAL_THERE,
  ONLY_DRAFTS_DELETED,
  PROPOSALS_NOT_YET_VISIBLE,
  PROPOSAL_ACTION_NOT_AVAILABLE,
  ProposalProblem,
  ProposalStanding,
  SELECT_DIFFERENT_ORGANIZATION,
  TERMS_NOT_ACCEPTED,
  TermsStanding,
  UNKNOWN_PROPOSAL_STATE,
  cwuProposalProblems,
  draftProposalProblems,
  hasClosedToProposals,
  hasCurrentTerms,
  isAcceptingProposals,
  mayDeleteInState,
  mayEditInState,
  mayListOpportunityProposals,
  mayManageProposal,
  mayReadProposal,
  mayStartProposal,
  maySubmitFrom,
  mayWithdrawFrom,
  proposalRefusalLine,
  readAttachments,
  readCwuProposalInput,
  readIndividual,
  readProponent,
} from "../rules/proposals";
import { CWU_PROPOSAL_STORE, CwuProposalAnswer, CwuProposalStore, OpportunityOfProposal, StoredCwuProposal } from "./cwu-proposal";

/** Who is asking: an account, with where it stands with the terms. */
export type ProposalAsker = TermsStanding;

export const ATTACHMENT_NOT_READABLE = "attachments: You can only attach a file you are permitted to read.";
export const ORGANIZATION_NOT_ACTIVE = "organization: Choose an organization that exists and is active";

/** One tagged change to a proposal, as `updateCodeWithUsProposal` carries it. */
export interface TaggedChange {
  readonly tag?: unknown;
  readonly value?: unknown;
}

/**
 * Code With Us proposals: starting one, reading them, changing, submitting, withdrawing and
 * deleting them (decision record 0055).
 *
 * Only a vendor who has accepted the terms at some point starts one (R-2.1), as a draft or a
 * submission and nothing else (R-2.7), one per vendor and one per organization on each opportunity
 * (R-2.2, R-2.11). A draft is kept however incomplete, but every file it names is checked (R-2.12,
 * R-8.22); anything put forward is checked in full (R-2.13, R-2.14), needs the current terms
 * accepted (R-2.3), and is refused once the deadline has passed (R-2.15). A submitted proposal may
 * be withdrawn at any time and put back only while proposals are accepted (R-2.23); only a draft is
 * deleted (R-2.4). A vendor sees their own and their organizations' proposals and no other
 * vendor's (R-2.24); staff see none until the opportunity has closed, and never a draft (R-1.31,
 * R-2.25).
 */
@Injectable()
export class CwuProposalsService {
  constructor(
    @Inject(CWU_PROPOSAL_STORE) private readonly store: CwuProposalStore,
    @Inject(ATTACHMENT_ACCESS) private readonly files: AttachmentAccess,
    @Inject(CLOCK) private readonly clock: Clock,
    @Optional() private readonly notices?: ProposalNotices,
  ) {}

  /**
   * The proposals the person may see: a vendor's own and their organizations', on one opportunity
   * or on all; or, to the opportunity's author and administrators once it has closed, the ones
   * put forward on it.
   */
  async list(asker: ProposalAsker | null, opportunityId?: string): Promise<CwuProposalAnswer[]> {
    if (!asker) throw new UnauthorizedException("Sign in to see proposals.");
    const managed = await this.managedBy(asker);
    if (asker.type === "VENDOR") {
      const mine = await this.store.forVendor(asker.id, managed);
      return mine
        .filter((proposal) => opportunityId === undefined || proposal.opportunity.id === opportunityId.toLowerCase())
        .filter((proposal) => this.mayRead(asker, proposal, managed))
        .map((proposal) => this.answerFor(proposal, asker));
    }
    // Staff are shown each proposal's rank among the others on the opportunity (R-2.32).
    if (opportunityId === undefined) return [];
    const opportunity = await this.store.opportunity(opportunityId.toLowerCase());
    if (!opportunity) throw new NotFoundException(NO_OPPORTUNITY_FOR_PROPOSAL);
    const closed = hasClosedToProposals(opportunity, this.clock());
    if (!mayListOpportunityProposals(asker, { createdBy: opportunity.createdBy, closed })) {
      throw new UnauthorizedException(PROPOSALS_NOT_YET_VISIBLE);
    }
    const all = await this.store.forOpportunity(opportunity.id);
    return all
      .filter((proposal) => this.mayRead(asker, proposal, managed))
      .map((proposal) => this.answerFor(proposal, asker, rankAmong(proposal.id, all)));
  }

  /** One proposal, for someone who may read it; one they may not is answered as one that is not there. */
  async read(asker: ProposalAsker | null, id: string): Promise<CwuProposalAnswer> {
    const { proposal } = await this.readable(asker, id);
    return this.answerWithRank(proposal, asker);
  }

  /** A new proposal, as a draft or as a submission (R-2.1, R-2.7). */
  async create(asker: ProposalAsker | null, body: unknown): Promise<CwuProposalAnswer> {
    if (!asker || !mayStartProposal(asker)) throw new UnauthorizedException(NOT_PERMITTED_TO_START);
    const given = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
    const requested = given.status ?? "DRAFT";
    if (!CREATABLE_PROPOSAL_STATES.includes(requested as CwuProposalStatus)) throw new BadRequestException([UNKNOWN_PROPOSAL_STATE]);
    const status = requested as CwuProposalStatus;

    const opportunityId = typeof given.opportunity === "string" ? given.opportunity.toLowerCase() : null;
    const opportunity = opportunityId ? await this.store.opportunity(opportunityId) : null;
    if (!opportunity) throw new BadRequestException([NO_OPPORTUNITY_FOR_PROPOSAL]);
    // Only a published opportunity takes proposals at all; one put forward must also be in time (R-2.15).
    if (opportunity.status !== "PUBLISHED") throw new BadRequestException([NOT_ACCEPTING_PROPOSALS]);
    if (status === "SUBMITTED") this.mustBeInTime(opportunity);

    const existing = (await this.store.forOpportunity(opportunity.id)).filter((proposal) => proposal.createdBy?.id === asker.id);
    if (existing[0]) throw new DetailedRefusal(400, [ALREADY_HAVE_PROPOSAL], { existingProposalId: existing[0].id });
    if (status === "SUBMITTED" && !hasCurrentTerms(asker)) throw new UnauthorizedException(TERMS_NOT_ACCEPTED);

    const input = readCwuProposalInput(given);
    await this.checkContent(asker, opportunity, input, status === "SUBMITTED", null);
    const id = await this.store.create(opportunity.id, input, status, asker.id);
    const created = await this.mustFind(id);
    if (status === "SUBMITTED") this.tellOfSubmission(created, asker.id);
    return this.answerFor(created, asker);
  }

  /**
   * One tagged change: the vendor's edit, submission or withdrawal, or, once the opportunity has
   * closed, its author's or an administrator's score, disqualification or award.
   */
  async change(asker: ProposalAsker | null, id: string, change: TaggedChange): Promise<CwuProposalAnswer> {
    const { proposal, managed } = await this.readable(asker, id);
    if (EVALUATION_TAGS.includes(change?.tag as string)) {
      await this.evaluate(asker, proposal, change);
      return this.answerWithRank(await this.mustFind(proposal.id), asker);
    }
    if (!asker || !mayManageProposal(asker, standingOf(proposal, this.clock()), managesOrganization(proposal, managed))) {
      if (["edit", "submit", "withdraw"].includes(change?.tag as string)) {
        throw new UnauthorizedException(NOT_PERMITTED_TO_CHANGE_PROPOSAL);
      }
      throw new BadRequestException([PROPOSAL_ACTION_NOT_AVAILABLE]);
    }
    switch (change?.tag) {
      case "edit":
        await this.edit(asker, proposal, change.value);
        break;
      case "submit":
        await this.submit(asker, proposal, change.value);
        break;
      case "withdraw":
        if (!mayWithdrawFrom(proposal.status)) throw new BadRequestException([CANNOT_WITHDRAW_NOW]);
        await this.store.changeStatus(proposal.id, "WITHDRAWN", asker.id, noteFrom(change.value));
        this.tellOfWithdrawal(proposal, asker.id);
        break;
      default:
        throw new BadRequestException([PROPOSAL_ACTION_NOT_AVAILABLE]);
    }
    return this.answerWithRank(await this.mustFind(proposal.id), asker);
  }

  // ---------------------------------------------------------------------- evaluation

  /**
   * A score, a disqualification or an award, by an administrator or the opportunity's author once
   * it has closed (R-2.26, R-2.33, R-2.34). Who asks is checked before what they ask.
   */
  private async evaluate(asker: ProposalAsker | null, proposal: StoredCwuProposal, change: TaggedChange): Promise<void> {
    if (!mayEvaluateProposal(asker, proposal.opportunity) || !asker) throw new UnauthorizedException(NOT_PERMITTED_TO_EVALUATE);
    const opportunity = proposal.opportunity.status;
    switch (change.tag) {
      case "score": {
        const score = readScore(change.value);
        if (score === null) throw new BadRequestException([`score: ${SCORE_MESSAGE}`]);
        if (!mayScoreInState(proposal.status, opportunity)) throw new BadRequestException([CANNOT_SCORE_NOW]);
        await this.store.score(proposal.id, score, asker.id);
        await this.moveOnIfAllEvaluated(proposal.opportunity);
        return;
      }
      case "disqualify": {
        const problem = disqualificationReasonProblem(change.value);
        if (problem) throw new BadRequestException([`disqualificationReason: ${problem}`]);
        if (!mayDisqualifyInState(proposal.status, opportunity)) throw new BadRequestException([CANNOT_DISQUALIFY_NOW]);
        await this.store.changeStatus(proposal.id, "DISQUALIFIED", asker.id, (change.value as string).trim());
        await this.moveOnIfAllEvaluated(proposal.opportunity);
        return;
      }
      case "award": {
        if (!mayAwardInState(proposal.status, opportunity)) throw new BadRequestException([CANNOT_AWARD_NOW]);
        const all = await this.store.forOpportunity(proposal.opportunity.id);
        const passedOver = await this.store.award(proposal.id, asker.id, noteFrom(change.value));
        this.tellOfAward(proposal, all.filter((other) => passedOver.includes(other.id)));
        return;
      }
    }
  }

  /**
   * Once every proposal still in contention has been evaluated, the opportunity moves to processing
   * on its own, with a note saying why (R-1.25, R-2.27).
   */
  private async moveOnIfAllEvaluated(opportunity: OpportunityOfProposal): Promise<void> {
    if (opportunity.status !== "EVALUATION") return;
    const all = await this.store.forOpportunity(opportunity.id);
    if (!allInContentionEvaluated(all.map((proposal) => proposal.status))) return;
    await this.store.changeOpportunityStatus(opportunity.id, "PROCESSING", null, MOVED_TO_PROCESSING_NOTE);
  }

  // ---------------------------------------------------------------------- telling people (R-2.36)

  private tellOfSubmission(proposal: StoredCwuProposal, vendor: string): void {
    this.notices?.submitted({ subject: subjectOf(proposal), vendor });
  }

  private tellOfWithdrawal(proposal: StoredCwuProposal, vendor: string): void {
    this.notices?.withdrawn({ subject: subjectOf(proposal), vendor }, proponentNameOf(proposal) ?? "A vendor");
  }

  /** The winner is sent an award notice; each proponent passed over a decision notice naming the winner (R-6.25). */
  private tellOfAward(winner: StoredCwuProposal, passedOver: readonly StoredCwuProposal[]): void {
    this.notices?.awarded(
      { subject: subjectOf(winner), vendor: winner.createdBy?.id ?? null },
      proponentNameOf(winner),
      passedOver.map((other) => ({ subject: subjectOf(other), vendor: other.createdBy?.id ?? null })),
    );
  }

  /** Deletes a draft for good (R-2.4); anything put forward is refused. */
  async remove(asker: ProposalAsker | null, id: string): Promise<CwuProposalAnswer> {
    const { proposal, managed } = await this.readable(asker, id);
    if (!asker || !mayManageProposal(asker, standingOf(proposal, this.clock()), managesOrganization(proposal, managed))) {
      throw new UnauthorizedException(NOT_PERMITTED_TO_CHANGE_PROPOSAL);
    }
    if (!mayDeleteInState(proposal.status)) throw new BadRequestException([ONLY_DRAFTS_DELETED]);
    await this.store.remove(proposal.id);
    return this.answerFor(proposal, asker);
  }

  // ---------------------------------------------------------------------- the changes

  /**
   * New content, keeping whatever the request leaves out, so a request naming only an attachment
   * to add saves the rest as it stands (surface file-attach-by-identifier). A draft is kept however
   * incomplete (R-2.12); a submitted proposal stays complete.
   */
  private async edit(asker: ProposalAsker, proposal: StoredCwuProposal, value: unknown): Promise<void> {
    const now = this.clock();
    if (!mayEditInState(proposal.status, isAcceptingProposals(proposal.opportunity, now))) {
      throw new BadRequestException([proposal.status === "DRAFT" ? CANNOT_EDIT_NOW : NOT_ACCEPTING_OR_CANNOT_EDIT(proposal)]);
    }
    const input = mergedInput(proposal, value);
    await this.checkContent(asker, proposal.opportunity, input, proposal.status === "SUBMITTED", proposal.id);
    await this.store.update(proposal.id, input, asker.id);
  }

  /**
   * A draft, or a withdrawn proposal, put forward: in time, complete, with the current terms
   * accepted (R-2.3, R-2.13, R-2.14, R-2.15, R-2.23).
   */
  private async submit(asker: ProposalAsker, proposal: StoredCwuProposal, value: unknown): Promise<void> {
    if (!maySubmitFrom(proposal.status)) throw new BadRequestException([CANNOT_SUBMIT_NOW]);
    this.mustBeInTime(proposal.opportunity);
    if (!hasCurrentTerms(asker)) throw new UnauthorizedException(TERMS_NOT_ACCEPTED);
    await this.checkContent(asker, proposal.opportunity, storedInput(proposal), true, proposal.id);
    await this.store.changeStatus(proposal.id, "SUBMITTED", asker.id, noteFrom(value));
    this.tellOfSubmission(proposal, asker.id);
  }

  // ---------------------------------------------------------------------- checks

  private mustBeInTime(opportunity: OpportunityOfProposal): void {
    if (!isAcceptingProposals(opportunity, this.clock())) throw new BadRequestException([NOT_ACCEPTING_PROPOSALS]);
  }

  /**
   * What a proposal holds: every file named must be one the person may read, even in a draft
   * (R-2.12, R-8.22); a proposal put forward must be complete (R-2.13, R-2.14) and name an active
   * organization if it names one; and an organization may be named on one proposal per opportunity
   * (R-2.11), which is answered with that proposal's identifier.
   */
  private async checkContent(
    asker: ProposalAsker,
    opportunity: OpportunityOfProposal,
    input: CwuProposalInput,
    complete: boolean,
    self: string | null,
  ): Promise<void> {
    for (const fileId of input.attachments) {
      if (!(await this.files.mayRead(fileId, asker))) throw new BadRequestException([ATTACHMENT_NOT_READABLE]);
    }
    const problems: ProposalProblem[] = complete ? cwuProposalProblems(input) : draftProposalProblems(input);
    if (problems.length > 0) throw new BadRequestException(problems.map(proposalRefusalLine));

    const { proponent } = input;
    if (proponent.tag !== "organization" || proponent.value === "") return;
    // The service looks only at whether the organization exists and is active, not at whether the
    // vendor belongs to it (R-2.14).
    const organization = await this.store.organization(proponent.value);
    if (!organization || (complete && !organization.active)) throw new BadRequestException([ORGANIZATION_NOT_ACTIVE]);
    const named = (await this.store.forOpportunity(opportunity.id)).find(
      (other) => other.id !== self && other.proponent.tag === "organization" && other.proponent.value.id === organization.id,
    );
    if (named) {
      throw new DetailedRefusal(400, [`organization: ${SELECT_DIFFERENT_ORGANIZATION}`], {
        existingOrganizationProposal: { proposalId: named.id },
      });
    }
  }

  private async readable(
    asker: ProposalAsker | null,
    id: string,
  ): Promise<{ proposal: StoredCwuProposal; managed: readonly string[] }> {
    const found = /^[0-9a-f-]{36}$/i.test(id) ? await this.store.find(id.toLowerCase()) : null;
    const managed = asker ? await this.managedBy(asker) : [];
    if (!found || !this.mayRead(asker, found, managed)) throw new NotFoundException(NO_PROPOSAL_THERE);
    return { proposal: found, managed };
  }

  private mayRead(asker: ProposalAsker | null, proposal: StoredCwuProposal, managed: readonly string[]): boolean {
    return mayReadProposal(asker, standingOf(proposal, this.clock()), managesOrganization(proposal, managed));
  }

  private async managedBy(asker: ProposalAsker): Promise<string[]> {
    return asker.type === "VENDOR" ? this.store.managedOrganizations(asker.id) : [];
  }

  private async mustFind(id: string): Promise<StoredCwuProposal> {
    const found = await this.store.find(id);
    if (!found) throw new NotFoundException(NO_PROPOSAL_THERE);
    return found;
  }

  /** A proposal with its rank among the others on its opportunity (R-2.32). */
  private async answerWithRank(proposal: StoredCwuProposal, asker: ProposalAsker | null): Promise<CwuProposalAnswer> {
    const all = await this.store.forOpportunity(proposal.opportunity.id);
    return this.answerFor(proposal, asker, rankAmong(proposal.id, all));
  }

  /**
   * A proposal as the person asking is answered with it. Its score and rank are shown to staff, and
   * to the vendor only once a decision has been made (R-2.32).
   */
  private answerFor(proposal: StoredCwuProposal, asker: ProposalAsker | null, rank: Rank | null = null): CwuProposalAnswer {
    const decided = proposal.status === "AWARDED" || proposal.status === "NOT_AWARDED";
    const showsScore = asker !== null && (asker.type !== "VENDOR" || decided);
    const { proponent, opportunity } = proposal;
    return {
      id: proposal.id,
      program: "code-with-us",
      createdAt: proposal.createdAt.toISOString(),
      updatedAt: proposal.updatedAt.toISOString(),
      createdBy: proposal.createdBy,
      updatedBy: proposal.updatedBy,
      status: proposal.status,
      submittedAt: proposal.submittedAt?.toISOString() ?? null,
      opportunity: {
        id: opportunity.id,
        title: opportunity.title,
        status: opportunity.status,
        proposalDeadline: opportunity.proposalDeadline,
        reward: opportunity.reward,
      },
      proposalText: proposal.proposalText,
      additionalComments: proposal.additionalComments,
      proponent:
        proponent.tag === "organization"
          ? {
              tag: "organization",
              value: {
                id: proponent.value.id,
                legalName: proponent.value.legalName,
                // Who to reach at the organization, to whoever may see the score (R-1.27).
                ...(showsScore && proponent.value.contact ? { contact: proponent.value.contact } : {}),
              },
            }
          : proponent,
      attachments: proposal.attachments,
      anonymousProponentName: proposal.anonymousProponentName,
      ...(showsScore ? { score: proposal.score, rank } : {}),
      history: proposal.history.map((entry) => ({
        createdAt: entry.createdAt.toISOString(),
        createdBy: entry.createdBy,
        status: entry.status,
        event: entry.event,
        note: entry.note,
      })),
    };
  }
}

/** Why a submitted or withdrawn proposal may not be changed: the opportunity stopped taking proposals. */
function NOT_ACCEPTING_OR_CANNOT_EDIT(proposal: StoredCwuProposal): string {
  return proposal.status === "SUBMITTED" || proposal.status === "WITHDRAWN" ? NOT_ACCEPTING_PROPOSALS : CANNOT_EDIT_NOW;
}

const noteFrom = (value: unknown): string | null => (typeof value === "string" && value.trim() !== "" ? value.trim() : null);

/** The changes only an administrator or the opportunity's author makes, once it has closed. */
const EVALUATION_TAGS: readonly string[] = ["score", "disqualify", "award"];

function subjectOf(proposal: StoredCwuProposal): ProposalSubject {
  return {
    program: "code-with-us",
    opportunityId: proposal.opportunity.id,
    opportunityTitle: proposal.opportunity.title,
    proposalId: proposal.id,
  };
}

/** The legal name of the organization or individual a proposal is put forward by, if it has one. */
export function proponentNameOf(proposal: StoredCwuProposal): string | null {
  const name = proposal.proponent.value.legalName.trim();
  return name === "" ? null : name;
}

export function standingOf(proposal: StoredCwuProposal, now: Date): ProposalStanding {
  return {
    status: proposal.status,
    createdBy: proposal.createdBy?.id ?? null,
    organization: proposal.proponent.tag === "organization" ? proposal.proponent.value.id : null,
    opportunity: { createdBy: proposal.opportunity.createdBy, closed: hasClosedToProposals(proposal.opportunity, now) },
  };
}

function managesOrganization(proposal: StoredCwuProposal, managed: readonly string[]): boolean {
  return proposal.proponent.tag === "organization" && managed.includes(proposal.proponent.value.id);
}

/** The proposal's content as it is stored, in the shape a request gives it. */
export function storedInput(proposal: StoredCwuProposal): CwuProposalInput {
  return {
    proposalText: proposal.proposalText,
    additionalComments: proposal.additionalComments,
    proponent:
      proposal.proponent.tag === "organization"
        ? { tag: "organization", value: proposal.proponent.value.id }
        : { tag: "individual", value: proposal.proponent.value },
    attachments: proposal.attachments.map((attachment) => attachment.id),
  };
}

/** The stored content, overlaid with what a change names; what it leaves out stays as it was. */
export function mergedInput(proposal: StoredCwuProposal, value: unknown): CwuProposalInput {
  const stored = storedInput(proposal);
  const given = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  return {
    proposalText: typeof given.proposalText === "string" ? given.proposalText : stored.proposalText,
    additionalComments: typeof given.additionalComments === "string" ? given.additionalComments : stored.additionalComments,
    proponent: "proponent" in given ? readProponentKeeping(given.proponent, stored) : stored.proponent,
    attachments: "attachments" in given ? readAttachments(given.attachments) : stored.attachments,
  };
}

/** A proponent given in a change; an individual given only in part keeps the rest of what is stored. */
function readProponentKeeping(value: unknown, stored: CwuProposalInput): CwuProposalInput["proponent"] {
  const read = readProponent(value);
  if (read.tag !== "individual" || stored.proponent.tag !== "individual") return read;
  const given = typeof value === "object" && value !== null ? (value as { value?: unknown }).value : undefined;
  if (typeof given !== "object" || given === null) return stored.proponent;
  const partial = readIndividual(given);
  const kept = { ...stored.proponent.value };
  for (const field of Object.keys(partial) as (keyof typeof partial)[]) {
    if (field in given) kept[field] = partial[field];
  }
  return { tag: "individual", value: kept };
}
