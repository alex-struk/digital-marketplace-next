/**
 * Who may take a proposal away, and under what name it is taken: the printable copy of one
 * proposal (R-2.37), every proposal of an opportunity in one document (R-2.38), and the full report
 * of an opportunity (R-1.40). Nothing here imports NestJS, Prisma or Node; the pages call these.
 *
 * None of the three asks anything new of the service. The copy of one proposal is drawn from the
 * proposal the service already lets its reader read, the all-proposals document from the list it
 * already gives the opportunity's author and administrators once the opportunity has closed, and
 * the report from the opportunity and that list (decision record 0066).
 */

import type { AccountKind } from "./users";

export type ExportProgram = "code-with-us" | "sprint-with-us" | "team-with-us";

interface Viewer {
  readonly type: AccountKind | string;
}

/**
 * The states in which a Sprint With Us or Team With Us proposal has not yet reached its challenge
 * stage: put forward, or still being judged on its questions. Staff read it under its anonymous name
 * while it stands in one of these (R-2.37).
 */
const BEFORE_THE_CHALLENGE: readonly string[] = ["SUBMITTED", "UNDER_REVIEW_QUESTIONS", "EVALUATED_QUESTIONS"];

/**
 * Whether a staff reader's printable copy names the proponent only by its anonymous name: in Sprint
 * With Us and Team With Us, until the proposal reaches the code challenge or the challenge. A vendor
 * always reads their own organization's name, and Code With Us never anonymises (R-1.24, R-2.37).
 */
export function copyIsAnonymous(viewer: Viewer, program: ExportProgram, proposalStatus: string): boolean {
  if (viewer.type === "VENDOR" || program === "code-with-us") return false;
  return BEFORE_THE_CHALLENGE.includes(proposalStatus);
}

/** The name a proposal goes by in a document that withholds its proponent: its anonymous name, or its place counted from one. */
export function anonymousNameAt(anonymousProponentName: string, index: number): string {
  return anonymousProponentName.trim() !== "" ? anonymousProponentName : `Proponent ${index + 1}`;
}

/** Only public sector staff and administrators take every proposal away in one document (R-2.38). */
export function mayExportAllProposals(viewer: Viewer | null | undefined): boolean {
  return viewer?.type === "GOV" || viewer?.type === "ADMIN";
}

/** Only an administrator reads an opportunity's full report, its own author included (R-1.40). */
export function mayReadOpportunityReport(viewer: Viewer | null | undefined): boolean {
  return viewer?.type === "ADMIN";
}

/** The states a proposal in an exported document never holds: staff never see these (R-2.25). */
const NEVER_EXPORTED: readonly string[] = ["DRAFT", "WITHDRAWN"];

/**
 * The proposals an all-proposals document carries, in one order whether or not it names them: by
 * the anonymous name each was given when the opportunity closed ("Proponent 2" before "Proponent
 * 10"), then as the service listed them. Drafts and withdrawn proposals are never included (R-2.25,
 * R-2.38).
 */
export function exportedInOrder<P extends { readonly status: string; readonly anonymousProponentName?: string }>(proposals: readonly P[]): P[] {
  return proposals
    .map((proposal, index) => ({ proposal, index }))
    .filter(({ proposal }) => !NEVER_EXPORTED.includes(proposal.status))
    .sort((a, b) => {
      const left = a.proposal.anonymousProponentName ?? "";
      const right = b.proposal.anonymousProponentName ?? "";
      if (left !== "" && right !== "" && left !== right) return left.localeCompare(right, "en", { numeric: true });
      if (left === "" && right !== "") return 1;
      if (left !== "" && right === "") return -1;
      return a.index - b.index;
    })
    .map(({ proposal }) => proposal);
}

/** Whether an all-proposals document's address asks for the proponents to be withheld: `?anonymous=true`. */
export function asksForAnonymous(search: Record<string, unknown>): boolean {
  return search.anonymous === true || search.anonymous === "true";
}
