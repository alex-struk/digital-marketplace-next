import { CalendarDay, PROGRAM_NAMES } from "../../rules/opportunities";
import type { OtherProgram } from "../../rules/other-program-drafts";
import { Block, Envelope, Message } from "../message";
import { deadlineInWords } from "./code-with-us-opportunity";

/**
 * The messages about a Sprint With Us or Team With Us opportunity on its way to publication, and
 * to the people put on its evaluation panel (decision record 0045): the notice to every
 * administrator that one awaits review and the author's confirmation, the announcement to everyone
 * who asked for new-opportunity notices and the author's confirmation — as Code With Us sends them
 * (R-1.34, R-1.37) — and the notice to each person newly added to the panel once the opportunity
 * has left draft (R-5.17). The announcement is the one message the notice choice governs, so it
 * alone offers to unsubscribe (R-6.6, R-6.16). Messages to many are batched as blind copies by
 * whoever sends them (R-6.8, R-6.15).
 */

/** What the messages say about an opportunity. */
export interface OtherOpportunityInBrief {
  readonly program: OtherProgram;
  readonly id: string;
  readonly title: string;
  /** The total maximum budget (Sprint With Us) or the maximum budget (Team With Us). */
  readonly budget: number;
  readonly proposalDeadline: CalendarDay;
}

const KINDS: Readonly<Record<OtherProgram, string>> = { "sprint-with-us": "swu", "team-with-us": "twu" };

const viewAddress = (origin: string, opportunity: OtherOpportunityInBrief) =>
  `${origin}/opportunities/${opportunity.program}/${opportunity.id}`;
const manageAddress = (origin: string, opportunity: OtherOpportunityInBrief) => `${viewAddress(origin, opportunity)}/edit`;

function facts(opportunity: OtherOpportunityInBrief): Block {
  const budget = opportunity.program === "sprint-with-us" ? "Total maximum budget" : "Maximum budget";
  return {
    kind: "paragraph",
    content: [
      `${opportunity.title}. ${budget}: $${opportunity.budget.toLocaleString("en-CA")}. Proposals are due by ${deadlineInWords(
        opportunity.proposalDeadline,
      )}.`,
    ],
  };
}

/** To every administrator, batched as blind copies: an opportunity awaits review. */
export function otherSubmittedForReview(opportunity: OtherOpportunityInBrief, origin: string): Message {
  const program = PROGRAM_NAMES[opportunity.program];
  return {
    kind: `${KINDS[opportunity.program]}-opportunity-submitted-for-review`,
    subject: `A ${program} Opportunity Has Been Submitted For Review`,
    title: `A ${program} opportunity has been submitted for review`,
    body: [
      { kind: "paragraph", content: [`"${opportunity.title}" has been submitted for review and is waiting to be published.`] },
      facts(opportunity),
      { kind: "action", label: "Review the opportunity", href: manageAddress(origin, opportunity) },
    ],
  };
}

/** To the author: their opportunity has gone for review. */
export function otherSubmittedForReviewToAuthor(
  author: { readonly email: string | null },
  opportunity: OtherOpportunityInBrief,
  origin: string,
): Envelope {
  const program = PROGRAM_NAMES[opportunity.program];
  return {
    to: [author.email],
    message: {
      kind: `${KINDS[opportunity.program]}-opportunity-submitted-for-review-author`,
      subject: `Your ${program} Opportunity Has Been Submitted For Review`,
      title: `Your ${program} opportunity has been submitted for review`,
      body: [
        {
          kind: "paragraph",
          content: [
            `You have submitted "${opportunity.title}" for review. An administrator will review it and publish it. You will be emailed when it is published.`,
          ],
        },
        { kind: "action", label: "View the opportunity", href: manageAddress(origin, opportunity) },
      ],
    },
  };
}

/** To everyone who asked for new-opportunity notices, batched as blind copies. */
export function otherOpportunityPublished(opportunity: OtherOpportunityInBrief, origin: string): Message {
  const program = PROGRAM_NAMES[opportunity.program];
  return {
    kind: `${KINDS[opportunity.program]}-opportunity-published`,
    subject: `A New ${program} Opportunity Has Been Posted`,
    title: `A new ${program} opportunity has been posted`,
    governedByNoticeChoice: true,
    body: [
      { kind: "paragraph", content: [`A new ${program} opportunity has been posted on the Digital Marketplace.`] },
      facts(opportunity),
      { kind: "action", label: "View the opportunity", href: viewAddress(origin, opportunity) },
    ],
  };
}

/** To the author: their opportunity has been published. */
export function otherPublishedToAuthor(
  author: { readonly email: string | null },
  opportunity: OtherOpportunityInBrief,
  origin: string,
): Envelope {
  const program = PROGRAM_NAMES[opportunity.program];
  return {
    to: [author.email],
    message: {
      kind: `${KINDS[opportunity.program]}-opportunity-published-author`,
      subject: `Your ${program} Opportunity Has Been Posted`,
      title: `Your ${program} opportunity has been posted`,
      body: [
        {
          kind: "paragraph",
          content: [`"${opportunity.title}" has been published. Anyone can now read it and submit a proposal until its deadline.`],
        },
        facts(opportunity),
        { kind: "action", label: "View the opportunity", href: viewAddress(origin, opportunity) },
      ],
    },
  };
}

/**
 * To the people newly put on an opportunity's evaluation panel, batched as blind copies, once it
 * has left draft (R-5.17). Those already on the panel are not sent it again.
 */
export function addedToEvaluationPanel(opportunity: OtherOpportunityInBrief, origin: string): Message {
  const program = PROGRAM_NAMES[opportunity.program];
  return {
    kind: `${KINDS[opportunity.program]}-evaluation-panel-member-added`,
    subject: `You Have Been Added to the Evaluation Panel of a ${program} Opportunity`,
    title: `You have been added to the evaluation panel of a ${program} opportunity`,
    body: [
      {
        kind: "paragraph",
        content: [
          `You are now on the evaluation panel of "${opportunity.title}". Once proposals close, you will be asked to evaluate them.`,
        ],
      },
      facts(opportunity),
      { kind: "action", label: "View the opportunity", href: viewAddress(origin, opportunity) },
    ],
  };
}
