/**
 * Rules about proposals, as plain TypeScript.
 *
 * Nothing in this directory imports NestJS, Prisma or Node. The service and the single-page app
 * both call these functions, so the proposal form says the same thing about a proposal as the
 * service that refuses it (decision record 0001). Who may read a proposal, and so a file attached
 * to one, is one rule for all three programs (R-8.20).
 */

import { CalendarDay, OpportunityStatus, isCalendarDay, recordedInstantOf } from "./opportunities";
import { isPhoneNumber } from "./organizations";
import { SCORE_ENTERED, scoreInNote } from "./proposal-evaluation";
import { AccountKind, isEmailAddress } from "./users";

// ------------------------------------------------------------------------ states

/** The states a Code With Us proposal may hold (R-2.7, R-2.23, R-2.26, R-2.33, R-2.34). */
export const CWU_PROPOSAL_STATES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "EVALUATED",
  "AWARDED",
  "NOT_AWARDED",
  "DISQUALIFIED",
  "WITHDRAWN",
] as const;
export type CwuProposalStatus = (typeof CWU_PROPOSAL_STATES)[number];

export function isCwuProposalStatus(value: unknown): value is CwuProposalStatus {
  return typeof value === "string" && (CWU_PROPOSAL_STATES as readonly string[]).includes(value);
}

/** A proposal may be created only as a draft or as a submission, in every program (R-2.7). */
export const CREATABLE_PROPOSAL_STATES: readonly CwuProposalStatus[] = ["DRAFT", "SUBMITTED"];

/** The two states of a proposal that has not been put forward: staff never see these (R-2.25). */
export const UNSUBMITTED_PROPOSAL_STATES: readonly string[] = ["DRAFT", "WITHDRAWN"];

/** Each state in words, as the status badge shows it, in every program. */
const PROPOSAL_STATUS_LABELS: Readonly<Record<string, string>> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  EVALUATED: "Evaluated",
  AWARDED: "Awarded",
  NOT_AWARDED: "Not awarded",
  DISQUALIFIED: "Disqualified",
  WITHDRAWN: "Withdrawn",
  UNDER_REVIEW_QUESTIONS: "Under review: questions",
  EVALUATED_QUESTIONS: "Evaluated: questions",
  UNDER_REVIEW_CODE_CHALLENGE: "Under review: code challenge",
  EVALUATED_CODE_CHALLENGE: "Evaluated: code challenge",
  UNDER_REVIEW_TEAM_SCENARIO: "Under review: team scenario",
  EVALUATED_TEAM_SCENARIO: "Evaluated: team scenario",
  UNDER_REVIEW_CHALLENGE: "Under review: challenge",
  EVALUATED_CHALLENGE: "Evaluated: challenge",
};

export function proposalStatusLabel(status: string): string {
  return PROPOSAL_STATUS_LABELS[status] ?? status;
}

/** One entry in a proposal's history in words: "Draft created" for its first state, the state otherwise. */
export function proposalHistoryLabel(entry: {
  readonly status: string | null;
  readonly event: string | null;
  readonly note?: string | null;
}): string {
  if (entry.status === "DRAFT") return "Draft created";
  if (entry.status) return proposalStatusLabel(entry.status);
  if (entry.event === SCORE_ENTERED) {
    const score = scoreInNote(entry.note ?? null);
    return score ? `Score entered: ${score}` : "Score entered";
  }
  return entry.event ?? "";
}

// ------------------------------------------------------------------------ the opportunity's clock

/** An opportunity as far as its proposals are concerned: its state and when proposals close. */
export interface OpportunityForProposals {
  readonly status: OpportunityStatus;
  /** A calendar day; proposals close at 4:00 p.m. Pacific time on it (R-1.14). */
  readonly proposalDeadline: CalendarDay;
}

/** Whether the moment proposals close has come (R-2.15). */
export function deadlineHasPassed(proposalDeadline: CalendarDay, now: Date): boolean {
  if (!isCalendarDay(proposalDeadline)) return false;
  return now.getTime() >= recordedInstantOf(proposalDeadline).getTime();
}

/** Published and before its deadline: the one time a proposal may be put forward (R-2.15, R-2.23). */
export function isAcceptingProposals(opportunity: OpportunityForProposals, now: Date): boolean {
  return opportunity.status === "PUBLISHED" && !deadlineHasPassed(opportunity.proposalDeadline, now);
}

/**
 * Whether an opportunity has closed to proposals, so that staff may see the ones put forward
 * (R-1.31, R-2.25): it has moved on to evaluation or beyond, or its deadline has passed. One still
 * a draft or under review never received any; one cancelled before its deadline never closed.
 */
export function hasClosedToProposals(opportunity: OpportunityForProposals, now: Date): boolean {
  switch (opportunity.status) {
    case "DRAFT":
    case "UNDER_REVIEW":
      return false;
    case "PUBLISHED":
    case "CANCELED":
      return deadlineHasPassed(opportunity.proposalDeadline, now);
    default:
      return true;
  }
}

// ------------------------------------------------------------------------ who may do what

export interface ProposalViewer {
  readonly id: string;
  readonly type: AccountKind;
}

/** What a vendor's standing with the terms is: the acceptance that stands, and whether they ever accepted. */
export interface TermsStanding extends ProposalViewer {
  readonly acceptedTermsAt: string | Date | null;
  readonly lastAcceptedTermsAt: string | Date | null;
}

/**
 * Only a signed-in vendor who has accepted the service's terms at some point may start a proposal
 * (R-2.1); staff, administrators, visitors and a vendor who never accepted them are refused.
 */
export function mayStartProposal(viewer: TermsStanding | null): boolean {
  return viewer?.type === "VENDOR" && (viewer.acceptedTermsAt !== null || viewer.lastAcceptedTermsAt !== null);
}

/**
 * Submitting needs the service's current terms accepted (R-2.3): a vendor whose acceptance was
 * withdrawn by an announcement of changed terms accepts again, and the submission records it.
 */
export function hasCurrentTerms(viewer: TermsStanding | null): boolean {
  return viewer?.type === "VENDOR" && viewer.acceptedTermsAt !== null;
}

/** A proposal, as far as who may read it is concerned, in any of the three programs. */
export interface ProposalStanding {
  readonly status: string;
  readonly createdBy: string | null;
  /** The organization it is put forward for, if any. */
  readonly organization: string | null;
  readonly opportunity: {
    readonly createdBy: string | null;
    /** Whether the opportunity has closed to proposals (`hasClosedToProposals`). */
    readonly closed: boolean;
  };
}

const isAuthorOf = (viewer: ProposalViewer, proposal: ProposalStanding) =>
  proposal.createdBy !== null && proposal.createdBy === viewer.id;

/**
 * Who may read a proposal, and so a file attached to it (R-2.24, R-2.25, R-8.20), in every
 * program alike:
 *
 * - a vendor who wrote it, or who owns or administers the organization it is for — never another
 *   vendor;
 * - an administrator once the opportunity has closed, if it was put forward — withdrawn ones
 *   included;
 * - the member of staff who created the opportunity once it has closed, if it was put forward and
 *   not withdrawn (R-2.25 note).
 *
 * `managesOrganization` is whether the reader owns or administers the proposal's organization.
 */
export function mayReadProposal(viewer: ProposalViewer | null, proposal: ProposalStanding, managesOrganization: boolean): boolean {
  if (!viewer) return false;
  if (viewer.type === "VENDOR") return isAuthorOf(viewer, proposal) || (proposal.organization !== null && managesOrganization);
  if (!proposal.opportunity.closed || proposal.status === "DRAFT") return false;
  if (viewer.type === "ADMIN") return true;
  return proposal.opportunity.createdBy === viewer.id && !UNSUBMITTED_PROPOSAL_STATES.includes(proposal.status);
}

/**
 * Who may change a proposal — edit it, submit it, withdraw it, delete a draft: the vendor who
 * wrote it, and a vendor who owns or administers its organization.
 */
export function mayManageProposal(viewer: ProposalViewer | null, proposal: ProposalStanding, managesOrganization: boolean): boolean {
  return viewer?.type === "VENDOR" && (isAuthorOf(viewer, proposal) || (proposal.organization !== null && managesOrganization));
}

/**
 * The opportunity's author and administrators may list its proposals only once it has closed
 * (R-1.31, R-2.25).
 */
export function mayListOpportunityProposals(
  viewer: ProposalViewer | null,
  opportunity: { readonly createdBy: string | null; readonly closed: boolean },
): boolean {
  if (!viewer || !opportunity.closed) return false;
  return viewer.type === "ADMIN" || (viewer.type === "GOV" && opportunity.createdBy === viewer.id);
}

/** A draft may be edited at any time; a submitted or withdrawn one only while proposals are accepted. */
export function mayEditInState(status: string, accepting: boolean): boolean {
  if (status === "DRAFT") return true;
  return (status === "SUBMITTED" || status === "WITHDRAWN") && accepting;
}

/** A draft, or a withdrawn proposal put back in (R-2.23). */
export function maySubmitFrom(status: string): boolean {
  return status === "DRAFT" || status === "WITHDRAWN";
}

/** A submitted proposal may be withdrawn at any time, whatever has happened to it since (R-2.23). */
export function mayWithdrawFrom(status: string): boolean {
  return ["SUBMITTED", "UNDER_REVIEW", "EVALUATED", "AWARDED", "NOT_AWARDED"].includes(status);
}

/** Only a draft is deleted (R-2.4). */
export function mayDeleteInState(status: string): boolean {
  return status === "DRAFT";
}

/**
 * What the manage page's action bar offers in each state (design/DESIGN.md, proposals, "Who is
 * offered what"). The service still decides: a refusal the screen could not prevent — the
 * deadline having passed — is said where the story shows it.
 */
export function offeredProposalActions(status: string): {
  readonly edit: boolean;
  readonly submit: boolean;
  readonly withdraw: boolean;
  readonly delete: boolean;
} {
  return {
    edit: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "EVALUATED", "WITHDRAWN"].includes(status),
    submit: maySubmitFrom(status),
    withdraw: mayWithdrawFrom(status),
    delete: mayDeleteInState(status),
  };
}

// ------------------------------------------------------------------------ refusals

export const NOT_PERMITTED_TO_START =
  "Only a signed-in vendor who has accepted the terms and conditions may start a proposal.";
export const ALREADY_HAVE_PROPOSAL = "You already have a proposal for this opportunity.";
export const NOT_ACCEPTING_PROPOSALS = "This opportunity is no longer accepting proposals.";
export const SELECT_DIFFERENT_ORGANIZATION = "Please select a different organization.";
export const TERMS_NOT_ACCEPTED =
  "Accept the Code With Us terms and conditions and the Digital Marketplace terms and conditions to submit a proposal.";
export const NO_PROPOSAL_THERE = "No proposal is held at that address.";
export const NOT_PERMITTED_TO_CHANGE_PROPOSAL = "You are not permitted to change this proposal.";
export const ONLY_DRAFTS_DELETED = "Only a draft proposal can be deleted.";
export const CANNOT_EDIT_NOW = "This proposal can no longer be changed.";
export const CANNOT_SUBMIT_NOW = "Only a draft or a withdrawn proposal can be submitted.";
export const CANNOT_WITHDRAW_NOW = "Only a proposal that has been submitted can be withdrawn.";
export const PROPOSALS_NOT_YET_VISIBLE =
  "An opportunity's proposals can be seen only by its author and administrators, once it has closed.";
export const PROPOSAL_ACTION_NOT_AVAILABLE = "That action is not available on this proposal.";
export const UNKNOWN_PROPOSAL_STATE = "status: A proposal is created as a draft (DRAFT) or as a submission (SUBMITTED).";
export const NO_OPPORTUNITY_FOR_PROPOSAL = "opportunity: Choose a published opportunity to propose on.";

// ------------------------------------------------------------------------ content

export const PROPOSAL_TEXT_MAX = 10_000;
export const ADDITIONAL_COMMENTS_MAX = 10_000;
export const PROPONENT_TEXT_MAX = 100;

/** A named individual putting the proposal forward (R-2.14). */
export interface IndividualProponent {
  readonly legalName: string;
  readonly email: string;
  readonly phone: string;
  readonly street1: string;
  readonly street2: string;
  readonly city: string;
  readonly region: string;
  readonly mailCode: string;
  readonly country: string;
}

export const INDIVIDUAL_FIELDS = [
  "legalName",
  "email",
  "phone",
  "street1",
  "street2",
  "city",
  "region",
  "mailCode",
  "country",
] as const satisfies readonly (keyof IndividualProponent)[];

export function blankIndividual(): IndividualProponent {
  return { legalName: "", email: "", phone: "", street1: "", street2: "", city: "", region: "", mailCode: "", country: "" };
}

export type ProponentInput =
  | { readonly tag: "individual"; readonly value: IndividualProponent }
  /** The organization's identifier, or "" while none is chosen. */
  | { readonly tag: "organization"; readonly value: string };

export interface CwuProposalInput {
  readonly proposalText: string;
  readonly additionalComments: string;
  readonly proponent: ProponentInput;
  /** Stored files, by identifier. */
  readonly attachments: readonly string[];
}

export type CwuProposalField =
  /** Whether an individual or an organization is putting the proposal forward; only a screen asks. */
  | "proponentType"
  | keyof IndividualProponent
  | "organization"
  | "proposalText"
  | "additionalComments"
  | "attachments";

/** Each field in words, as the form labels it and its error summary names it. */
export const CWU_PROPOSAL_FIELD_LABELS: Readonly<Record<CwuProposalField, string>> = {
  proponentType: "Proponent",
  legalName: "Legal name",
  email: "Email address",
  phone: "Phone number",
  street1: "Street address",
  street2: "Street address line 2",
  city: "City",
  region: "Province or state",
  mailCode: "Postal code",
  country: "Country",
  organization: "Organization",
  proposalText: "Proposal",
  additionalComments: "Additional comments",
  attachments: "Attachments",
};

/** The order fields appear on the form, which the error summary follows. */
export const CWU_PROPOSAL_FIELD_ORDER = Object.keys(CWU_PROPOSAL_FIELD_LABELS) as CwuProposalField[];

export interface ProposalProblem {
  readonly field: CwuProposalField;
  readonly message: string;
}

/** A refusal line names the field it is about by its name in the request (decision record 0029). */
export function proposalRefusalLine(problem: ProposalProblem): string {
  return `${problem.field}: ${problem.message}`;
}

/** Reads a refusal line back into the field it names, for a screen showing the service's refusal. */
export function proposalProblemFromLine(line: string): ProposalProblem | null {
  const colon = line.indexOf(": ");
  if (colon < 0) return null;
  const field = line.slice(0, colon);
  return field in CWU_PROPOSAL_FIELD_LABELS ? { field: field as CwuProposalField, message: line.slice(colon + 2) } : null;
}

const text = (value: unknown): string => (typeof value === "string" ? value : "");
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

/** An identifier given as itself, or as a record carrying one (a file record, an organization). */
export function identifierOf(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (isRecord(value) && typeof value.id === "string") return value.id;
  return null;
}

/** An individual proponent read loosely from what was sent; each field is judged afterwards. */
export function readIndividual(value: unknown): IndividualProponent {
  const given = isRecord(value) ? value : {};
  const read = blankIndividual() as Record<keyof IndividualProponent, string>;
  for (const field of INDIVIDUAL_FIELDS) read[field] = text(given[field]);
  return read;
}

/** A proponent read loosely: an individual, unless it names an organization. */
export function readProponent(value: unknown): ProponentInput {
  if (isRecord(value) && value.tag === "organization") {
    return { tag: "organization", value: (identifierOf(value.value) ?? "").trim().toLowerCase() };
  }
  return { tag: "individual", value: readIndividual(isRecord(value) ? value.value : undefined) };
}

/** Attachments named by identifier or by file record, each once. */
export function readAttachments(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids = value.map(identifierOf).filter((id): id is string => id !== null && id.trim() !== "");
  return [...new Set(ids.map((id) => id.trim().toLowerCase()))];
}

/** Reads a proposal's content loosely; what it says is judged afterwards. */
export function readCwuProposalInput(body: unknown): CwuProposalInput {
  const given = isRecord(body) ? body : {};
  return {
    proposalText: text(given.proposalText),
    additionalComments: text(given.additionalComments),
    proponent: readProponent(given.proponent),
    attachments: readAttachments(given.attachments),
  };
}

function requiredText(field: CwuProposalField, value: string, missing: string, problems: ProposalProblem[]): void {
  const trimmed = value.trim();
  if (trimmed === "") problems.push({ field, message: missing });
  else if (trimmed.length > PROPONENT_TEXT_MAX) {
    problems.push({ field, message: `${CWU_PROPOSAL_FIELD_LABELS[field]} must be ${PROPONENT_TEXT_MAX} characters or fewer` });
  }
}

/** What is wrong with an individual proponent, each field in turn (R-2.14). */
export function individualProblems(individual: IndividualProponent): ProposalProblem[] {
  const problems: ProposalProblem[] = [];
  requiredText("legalName", individual.legalName, "Enter your legal name", problems);
  const email = individual.email.trim();
  if (email === "" || !isEmailAddress(email) || email.length > PROPONENT_TEXT_MAX) {
    problems.push({ field: "email", message: "Enter an email address in the form name@example.com" });
  }
  const phone = individual.phone.trim();
  if (phone !== "" && !isPhoneNumber(phone)) {
    problems.push({ field: "phone", message: "Enter a phone number in a valid format, like 250-555-0100, or leave it blank" });
  }
  requiredText("street1", individual.street1, "Enter a street address", problems);
  if (individual.street2.trim().length > PROPONENT_TEXT_MAX) {
    problems.push({ field: "street2", message: `Street address line 2 must be ${PROPONENT_TEXT_MAX} characters or fewer` });
  }
  requiredText("city", individual.city, "Enter a city", problems);
  requiredText("region", individual.region, "Enter a province or state", problems);
  requiredText("mailCode", individual.mailCode, "Enter a postal code", problems);
  requiredText("country", individual.country, "Enter a country", problems);
  return problems;
}

/**
 * What is wrong with a proposal that is not a draft (R-2.13, R-2.14): proposal text of 1 to 10,000
 * characters, comments of at most 10,000, and a complete proponent — an individual's every field,
 * or an organization chosen. Whether the organization exists and is active is the service's to
 * check, since only it can look.
 */
export function cwuProposalProblems(input: CwuProposalInput): ProposalProblem[] {
  const problems: ProposalProblem[] =
    input.proponent.tag === "individual"
      ? individualProblems(input.proponent.value)
      : input.proponent.value === ""
        ? [{ field: "organization", message: "Choose the organization this proposal is for" }]
        : [];
  if (input.proposalText.trim() === "" || input.proposalText.length > PROPOSAL_TEXT_MAX) {
    problems.push({ field: "proposalText", message: "Enter your proposal, up to 10,000 characters" });
  }
  if (input.additionalComments.length > ADDITIONAL_COMMENTS_MAX) {
    problems.push({ field: "additionalComments", message: "Additional comments must be 10,000 characters or fewer" });
  }
  return problems;
}

/**
 * What a draft may hold however incomplete (R-2.12): nothing is judged but the limits a stored
 * field cannot exceed, which are refused rather than cut.
 */
export function draftProposalProblems(input: CwuProposalInput): ProposalProblem[] {
  const problems: ProposalProblem[] = [];
  if (input.proposalText.length > PROPOSAL_TEXT_MAX) {
    problems.push({ field: "proposalText", message: "Enter your proposal, up to 10,000 characters" });
  }
  if (input.additionalComments.length > ADDITIONAL_COMMENTS_MAX) {
    problems.push({ field: "additionalComments", message: "Additional comments must be 10,000 characters or fewer" });
  }
  return problems;
}
