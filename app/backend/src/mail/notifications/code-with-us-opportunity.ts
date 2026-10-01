import { CalendarDay } from "../../rules/opportunities";
import { Block, Envelope, Message } from "../message";

/**
 * The messages about a Code With Us opportunity's way to publication: the notice to every
 * administrator that one awaits review and the author's confirmation (R-1.37), and the
 * announcement to everyone who asked for new-opportunity notices and the author's confirmation
 * (R-1.34). The announcement is the one message the notice choice governs, so it alone offers to
 * unsubscribe (R-6.6, R-6.16). The messages to many are batched as blind copies by whoever sends
 * them (R-6.8, R-6.15).
 */

/** What the messages say about an opportunity. */
export interface OpportunityInBrief {
  readonly id: string;
  readonly title: string;
  readonly reward: number;
  readonly proposalDeadline: CalendarDay;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** "June 1, 2030 at 4:00 p.m. Pacific time", the moment proposals close (R-1.14). */
export function deadlineInWords(day: CalendarDay): string {
  const [year, month, date] = day.split("-").map(Number);
  return `${MONTHS[(month ?? 1) - 1]} ${date}, ${year} at 4:00 p.m. Pacific time`;
}

const viewAddress = (origin: string, id: string) => `${origin}/opportunities/code-with-us/${id}`;
const manageAddress = (origin: string, id: string) => `${origin}/opportunities/code-with-us/${id}/edit`;

function facts(opportunity: OpportunityInBrief): Block {
  return {
    kind: "paragraph",
    content: [
      `${opportunity.title}. Reward: $${opportunity.reward.toLocaleString("en-CA")}. Proposals are due by ${deadlineInWords(
        opportunity.proposalDeadline,
      )}.`,
    ],
  };
}

/** To every administrator, batched as blind copies: an opportunity awaits review (R-1.37). */
export function submittedForReview(opportunity: OpportunityInBrief, origin: string): Message {
  return {
    kind: "cwu-opportunity-submitted-for-review",
    subject: "A Code With Us Opportunity Has Been Submitted For Review",
    title: "A Code With Us opportunity has been submitted for review",
    body: [
      { kind: "paragraph", content: [`"${opportunity.title}" has been submitted for review and is waiting to be published.`] },
      facts(opportunity),
      { kind: "action", label: "Review the opportunity", href: manageAddress(origin, opportunity.id) },
    ],
  };
}

/** To the author: their opportunity has gone for review (R-1.37). */
export function submittedForReviewToAuthor(
  author: { readonly email: string | null },
  opportunity: OpportunityInBrief,
  origin: string,
): Envelope {
  return {
    to: [author.email],
    message: {
      kind: "cwu-opportunity-submitted-for-review-author",
      subject: "Your Code With Us Opportunity Has Been Submitted For Review",
      title: "Your Code With Us opportunity has been submitted for review",
      body: [
        {
          kind: "paragraph",
          content: [
            `You have submitted "${opportunity.title}" for review. An administrator will review it and publish it. You will be emailed when it is published.`,
          ],
        },
        { kind: "action", label: "View the opportunity", href: manageAddress(origin, opportunity.id) },
      ],
    },
  };
}

/** To everyone who asked for new-opportunity notices, batched as blind copies (R-1.34, R-6.8). */
export function newOpportunityPublished(opportunity: OpportunityInBrief, origin: string): Message {
  return {
    kind: "cwu-opportunity-published",
    subject: "A New Code With Us Opportunity Has Been Posted",
    title: "A new Code With Us opportunity has been posted",
    governedByNoticeChoice: true,
    body: [
      { kind: "paragraph", content: ["A new Code With Us opportunity has been posted on the Digital Marketplace."] },
      facts(opportunity),
      { kind: "action", label: "View the opportunity", href: viewAddress(origin, opportunity.id) },
    ],
  };
}

/** To the author: their opportunity has been published (R-1.34). */
export function publishedToAuthor(
  author: { readonly email: string | null },
  opportunity: OpportunityInBrief,
  origin: string,
): Envelope {
  return {
    to: [author.email],
    message: {
      kind: "cwu-opportunity-published-author",
      subject: "Your Code With Us Opportunity Has Been Posted",
      title: "Your Code With Us opportunity has been posted",
      body: [
        {
          kind: "paragraph",
          content: [`"${opportunity.title}" has been published. Anyone can now read it and submit a proposal until its deadline.`],
        },
        facts(opportunity),
        { kind: "action", label: "View the opportunity", href: viewAddress(origin, opportunity.id) },
      ],
    },
  };
}
