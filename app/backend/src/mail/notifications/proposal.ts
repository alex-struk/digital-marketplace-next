import { PROGRAM_NAMES, Program } from "../../rules/opportunities";
import { Message } from "../message";

/**
 * The messages that follow what happens to a proposal, in every program (R-2.36): a confirmation
 * to the vendor who submitted it, an award notice to the winner and a decision notice to every
 * other proponent still in contention (R-6.25), and a withdrawal notice to the vendor and to every
 * administrator. None is governed by the new-opportunity notice choice, so none offers to
 * unsubscribe (R-6.16).
 */

/** What the messages say about the opportunity a proposal answers. */
export interface ProposalSubject {
  readonly program: Program;
  readonly opportunityId: string;
  readonly opportunityTitle: string;
  readonly proposalId: string;
}

const opportunityAddress = (origin: string, subject: ProposalSubject) =>
  `${origin}/opportunities/${subject.program}/${subject.opportunityId}`;
const proposalAddress = (origin: string, subject: ProposalSubject) =>
  `${opportunityAddress(origin, subject)}/proposals/${subject.proposalId}`;
const manageAddress = (origin: string, subject: ProposalSubject) => `${proposalAddress(origin, subject)}/edit`;
/** Signing in first, and then the vendor's own proposal, where its score is shown once decided (R-2.32). */
const signInToProposal = (origin: string, subject: ProposalSubject) =>
  `${origin}/sign-in?redirectOnSuccess=${encodeURIComponent(
    `/opportunities/${subject.program}/${subject.opportunityId}/proposals/${subject.proposalId}/edit`,
  )}`;

/** To the vendor who put a proposal forward: it has been submitted (R-2.36). */
export function proposalSubmitted(subject: ProposalSubject, origin: string): Message {
  const program = PROGRAM_NAMES[subject.program];
  return {
    kind: `${subject.program}-proposal-submitted`,
    subject: `Your ${program} Proposal Has Been Submitted`,
    title: `Your ${program} proposal has been submitted`,
    body: [
      {
        kind: "paragraph",
        content: [
          `You have submitted a proposal to the ${program} opportunity "${subject.opportunityTitle}". You can change or withdraw it until the opportunity closes.`,
        ],
      },
      { kind: "action", label: "View your proposal", href: manageAddress(origin, subject) },
    ],
  };
}

/** To the vendor who withdrew a proposal: it has been withdrawn (R-2.36). */
export function proposalWithdrawnToVendor(subject: ProposalSubject, origin: string): Message {
  const program = PROGRAM_NAMES[subject.program];
  return {
    kind: `${subject.program}-proposal-withdrawn`,
    subject: `Your ${program} Proposal Has Been Withdrawn`,
    title: `Your ${program} proposal has been withdrawn`,
    body: [
      {
        kind: "paragraph",
        content: [
          `Your proposal to the ${program} opportunity "${subject.opportunityTitle}" has been withdrawn. It will not be considered. You can submit it again while the opportunity is accepting proposals.`,
        ],
      },
      { kind: "action", label: "View your proposal", href: manageAddress(origin, subject) },
    ],
  };
}

/** To every administrator, batched as blind copies: a proposal has been withdrawn (R-2.36). */
export function proposalWithdrawnToAdministrators(subject: ProposalSubject, proponent: string, origin: string): Message {
  const program = PROGRAM_NAMES[subject.program];
  return {
    kind: `${subject.program}-proposal-withdrawn-administrators`,
    subject: `A ${program} Proposal Has Been Withdrawn`,
    title: `A ${program} proposal has been withdrawn`,
    body: [
      {
        kind: "paragraph",
        content: [`${proponent} has withdrawn their proposal to the ${program} opportunity "${subject.opportunityTitle}".`],
      },
      { kind: "action", label: "View the opportunity", href: opportunityAddress(origin, subject) },
    ],
  };
}

/** To the vendor whose proposal won: the opportunity has been awarded to them (R-2.36). */
export function proposalAwarded(subject: ProposalSubject, origin: string): Message {
  const program = PROGRAM_NAMES[subject.program];
  return {
    kind: `${subject.program}-proposal-awarded`,
    subject: `You Have Been Awarded a ${program} Opportunity`,
    title: `You have been awarded "${subject.opportunityTitle}"`,
    body: [
      {
        kind: "paragraph",
        content: [
          `Congratulations. Your proposal to the ${program} opportunity "${subject.opportunityTitle}" has been chosen. The opportunity's contact will be in touch with you about next steps.`,
        ],
      },
      { kind: "action", label: "Sign in to see your proposal", href: signInToProposal(origin, subject) },
    ],
  };
}

/**
 * To each proponent not chosen: the opportunity has been awarded to somebody else (R-2.36, R-6.25).
 * It leads with the opportunity's title and the winner's name — an em dash where no successful
 * proponent is recorded — and offers a way to sign in and see their own score.
 */
export function proposalNotAwarded(subject: ProposalSubject, winner: string | null, origin: string): Message {
  const program = PROGRAM_NAMES[subject.program];
  const awardedTo = winner && winner.trim() !== "" ? winner.trim() : "—";
  return {
    kind: `${subject.program}-proposal-not-awarded`,
    subject: `A ${program} Opportunity You Proposed On Has Been Awarded`,
    title: subject.opportunityTitle,
    body: [
      { kind: "paragraph", content: [`Awarded to: ${awardedTo}`] },
      {
        kind: "paragraph",
        content: [
          `The ${program} opportunity "${subject.opportunityTitle}" has been awarded to ${awardedTo}. Thank you for your proposal. Sign in to see your score and how your proposal ranked.`,
        ],
      },
      { kind: "action", label: "Sign in to see your score", href: signInToProposal(origin, subject) },
    ],
  };
}
